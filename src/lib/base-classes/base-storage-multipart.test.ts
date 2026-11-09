import { createHash, webcrypto, randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import type { R2Bucket, R2MultipartOptions, R2Object, R2UploadedPart } from '@cloudflare/workers-types';
import fse from 'fs-extra';
import type { HttpResponse, Ng2RestFetchRequestConfig } from 'ng2-rest/src';
import { EMPTY } from 'rxjs';

import type { ExpressRequest, ExpressResponse } from '../express-types';
import { uploadFileInChunks } from '../helpers/upload-file-in-chunks';
import type { TaonChunkedUploadTransport } from '../helpers/upload-file-in-chunks';
import { parseBody } from '../middlewares/parse-body';
import type { Models } from '../models';

import { TaonBaseStorageBackend } from './base-storage-backend';
import { TaonBaseStorageController } from './base-storage-controller';
import { TAON_MULTIPART_CHUNK_SIZE, TaonStorageObject } from './base-storage-models';

const runtime = vi.hoisted(() => ({ cloudflare: false }));

vi.mock('tnp-core/src', async () => {
  const fs = await import('fs-extra');
  const paths = await import('node:path');
  return {
    fse: fs.default, path: paths.default,
    crossPlatformPath: (segments: string[]) => segments.filter(Boolean).join('/'),
    UtilsOs: { isRunningInCloudflareWorker: () => runtime.cloudflare },
    GlobalStorage: { get: vi.fn() },
    CoreModels: { StatusCode401: 401 },
  };
});
vi.mock('../index', () => ({
  Taon: { error: ({ message, status }: { message: string; status: number }) => {
    throw () => ({ message, status });
  } },
}));
vi.mock('../constants', () => ({ Replecables: {} }));
vi.mock('@taon-dev/i18n/src', () => ({
  Translation: { for: () => ({ gettext: (text: string) => text }) },
}));
vi.mock('ng2-rest/src', () => ({ FetchResponseType: { Stream: 'stream' } }));
vi.mock('../helpers/class-helpers', () => ({
  ClassHelpers: { getName: () => 'TestStorageController' },
}));
vi.mock('../decorators/classes/controller-decorator', () => ({
  TaonController: () => (target: Function) => target,
}));
vi.mock('../decorators/http/http-methods-decorators', () => ({
  POST: () => () => {}, GET: () => () => {}, DELETE: () => () => {},
}));
vi.mock('../decorators/http/http-params-decorators', () => ({
  Body: () => () => {}, Query: () => () => {},
}));
vi.mock('./base-controller', () => ({ TaonBaseController: class {} }));

class StorageController extends TaonBaseStorageController {
  permitted = false;

  afterFileUploadHook = vi.fn();

  protected override async authorizeMultipartUpload(): Promise<boolean> {
    return this.permitted;
  }

  buildStorageDownloadUrl(): string {
    return '/download';
  }

  async createStorageDownloadToken(): Promise<string> {
    return 'token';
  }
}

const checksum = (data: Uint8Array): string => createHash('sha256').update(data).digest('hex');
const stream = (data: Uint8Array): ReadableStream<Uint8Array> => new Blob([Uint8Array.from(data)]).stream();
const request = (userId: number | string = 1): ExpressRequest =>
  Object.assign(Readable.from([]), { userId, headers: {} }) as ExpressRequest;
const response = {} as ExpressResponse;
const rejectsWithStatus = async (promise: Promise<unknown>, status: number): Promise<void> => {
  await expect(promise.catch(error => {
    throw typeof error === 'function' ? error() : error;
  })).rejects.toMatchObject({ status });
};
const clientAction = <T>(
  action: Models.Http.Response<T>,
  send: (config?: Ng2RestFetchRequestConfig) => Promise<T>,
): Models.Http.Response<T> => {
  action.request = vi.fn(config => Object.assign(
    send(config).then(data => ({ body: { json: data } }) as HttpResponse<T>),
    { observable: EMPTY },
  ));
  return action;
};

class TestDigestStream extends WritableStream<Uint8Array> {
  readonly digest: Promise<ArrayBuffer>;

  constructor() {
    const hash = createHash('sha256');
    let resolve: (value: ArrayBuffer) => void;
    let reject: (error: unknown) => void;
    const digest = new Promise<ArrayBuffer>((yes, no) => { resolve = yes; reject = no; });
    super({
      write: value => { hash.update(value); },
      close: () => { resolve(Uint8Array.from(hash.digest()).buffer); },
      abort: reject,
    });
    this.digest = digest;
  }
}

class TestFixedLengthStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(size: number) {
    let received = 0;
    super({
      transform(value, controller) {
        received += value.byteLength;
        if (received > size) {
          throw new Error('Fixed length exceeded');
        }
        controller.enqueue(value);
      },
      flush() {
        if (received !== size) {
          throw new Error('Fixed length mismatch');
        }
      },
    });
  }
}

const mockR2 = () => {
  const records = new Map<string, {
    data: Uint8Array; object: R2Object;
  }>();
  const uploads = new Map<string, {
    key: string; options: R2MultipartOptions;
    parts: Map<number, { data: Uint8Array; etag: string }>;
  }>();
  const object = (key: string, data: Uint8Array, options: R2MultipartOptions = {}): R2Object => ({
    key, size: data.byteLength, etag: randomUUID(), httpEtag: '"etag"',
    version: 'v1', uploaded: new Date(), checksums: { toJSON: () => ({}) }, storageClass: 'Standard',
    httpMetadata: !options.httpMetadata || 'get' in options.httpMetadata ? undefined : options.httpMetadata,
    customMetadata: options.customMetadata, writeHttpMetadata: () => {},
  });
  const uploadPart = vi.fn(async (uploadId: string, number: number, body: ReadableStream) => {
    const upload = uploads.get(uploadId);
    if (!upload) {
      throw new Error('Native upload missing');
    }
    const data = new Uint8Array(await new Response(body).arrayBuffer());
    const etag = randomUUID();
    upload.parts.set(number, { data, etag });
    return { partNumber: number, etag };
  });
  const complete = vi.fn(async (uploadId: string, parts: R2UploadedPart[]) => {
    const upload = uploads.get(uploadId);
    if (!upload) {
      throw new Error('Native upload missing');
    }
    const data = new Uint8Array(parts.reduce((sum, part) => sum + upload.parts.get(part.partNumber).data.length, 0));
    let offset = 0;
    for (const part of parts) {
      const saved = upload.parts.get(part.partNumber);
      if (saved.etag !== part.etag) {
        throw new Error('Native ETag mismatch');
      }
      data.set(saved.data, offset);
      offset += saved.data.length;
    }
    const result = object(upload.key, data, upload.options);
    records.set(upload.key, { data, object: result });
    uploads.delete(uploadId);
    return result;
  });
  const abort = vi.fn(async (uploadId: string) => { uploads.delete(uploadId); });
  const bucket = {
    createMultipartUpload: vi.fn(async (key: string, options: R2MultipartOptions) => {
      const uploadId = randomUUID();
      uploads.set(uploadId, { key, options, parts: new Map() });
      return bucket.resumeMultipartUpload(key, uploadId);
    }),
    resumeMultipartUpload: vi.fn((key: string, uploadId: string) => ({
      key, uploadId,
      uploadPart: (number: number, body: ReadableStream) => uploadPart(uploadId, number, body),
      complete: (parts: R2UploadedPart[]) => complete(uploadId, parts),
      abort: () => abort(uploadId),
    })),
    put: vi.fn(async (key: string, value: string, options?: { onlyIf?: { etagDoesNotMatch?: string } }) => {
      if (options?.onlyIf?.etagDoesNotMatch === '*' && records.has(key)) {
        return null;
      }
      const data = new TextEncoder().encode(value);
      const result = object(key, data);
      records.set(key, { data, object: result });
      return result;
    }),
    get: vi.fn(async (key: string) => {
      const saved = records.get(key);
      if (!saved) {
        return null;
      }
      return {
        ...saved.object,
        body: undefined,
        bodyUsed: false,
        json: async () => JSON.parse(new TextDecoder().decode(saved.data)),
        text: async () => new TextDecoder().decode(saved.data),
        arrayBuffer: async () => Uint8Array.from(saved.data).buffer,
        bytes: async () => saved.data,
        blob: vi.fn<import('@cloudflare/workers-types').R2ObjectBody['blob']>(),
        writeHttpMetadata: () => {},
      };
    }),
    head: vi.fn(async (key: string) => records.get(key)?.object || null),
    delete: vi.fn(async (keys: string | string[]) => {
      for (const key of typeof keys === 'string' ? [keys] : keys) {
        records.delete(key);
      }
    }),
    list: vi.fn(async ({ prefix }: { prefix: string }) => ({
      objects: [...records.values()].map(item => item.object).filter(item => item.key.startsWith(prefix)),
      truncated: false, delimitedPrefixes: [],
    })),
  };
  return { bucket: bucket as R2Bucket, records, uploads, uploadPart, complete, abort };
};

describe('storage multipart uploads', () => {
  let directory: string;
  let controller: StorageController;
  let backend: TaonBaseStorageBackend;
  let r2: ReturnType<typeof mockR2>;

  beforeEach(async () => {
    runtime.cloudflare = false;
    directory = await fse.promises.mkdtemp(path.join(tmpdir(), 'taon-multipart-test-'));
    r2 = mockR2();
    controller = new StorageController();
    Object.defineProperty(controller, 'ctx', {
      value: { bucketFileDbLocationBase: directory, R2: r2.bucket },
    });
    backend = new TaonBaseStorageBackend(controller);
    afterUpload.mockClear();
  });
  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
    await fse.remove(directory);
  });
  const afterUpload = vi.fn(async (object: TaonStorageObject) => [object]);

  const transport = (): TaonChunkedUploadTransport => ({
    start: chunkSize => backend.multipart.start('large.bin', '1', { size: 11, chunkSize }),
    part: (id, number, sha256, chunk) => chunk.arrayBuffer().then(data =>
      backend.multipart.uploadPart(id, '1', number, sha256, stream(new Uint8Array(data)))),
    complete: id => backend.multipart.complete(id, '1', afterUpload),
    abort: id => backend.multipart.abort(id, '1'),
  });

  it('preserves small multipart/form-data uploads, original metadata and hooks', async () => {
    const temporary = path.join(directory, 'small-temp');
    await fse.promises.writeFile(temporary, 'small');
    const files = [{
      fieldName: 'file', fileName: 'small.txt', originalFileName: 'original.txt',
      mimeType: 'text/plain', tempKeyOrPath: temporary,
    }];
    const result = await controller.uploadFormDataToServer(new FormData(), { tag: 'small' })(
      request(), response, { bodyFormDataFiles: files, t: undefined, expressPath: '' },
    );
    expect(result).toEqual([expect.objectContaining({
      key: 'small.txt', storageKey: 'TestStorageController/small.txt',
      fileName: 'original.txt', size: 5, contentType: 'text/plain',
    })]);
    expect(controller.afterFileUploadHook).toHaveBeenCalledTimes(1);
    expect(controller.afterFileUploadHook).toHaveBeenCalledWith(result[0], { tag: 'small' });
    expect(await fse.pathExists(temporary)).toBe(false);
  });

  it('denies new endpoints by default and requires authenticated ownership', async () => {
    await rejectsWithStatus(controller.startMultipartUpload({ fileName: 'x.bin', size: 10 })(request(), response), 403);
    controller.permitted = true;
    await rejectsWithStatus(controller.startMultipartUpload({ fileName: 'x.bin', size: 10 })(request(''), response), 401);
    const session = await backend.multipart.start('x.bin', '1', { size: 10 });
    await rejectsWithStatus(backend.multipart.inspect(session.uploadId, '2'), 403);
    await rejectsWithStatus(controller.abortMultipartUpload(session.uploadId)(request(2), response), 403);
  });

  it('generates server-owned keys and rechecks permission on every operation', async () => {
    controller.permitted = true;
    const session = await controller.startMultipartUpload({
      fileName: '../media.bin', size: 3, chunkSize: 3,
    })(request(), response);
    expect(typeof session).toBe('object');
    if (typeof session !== 'object') {
      throw new Error('Expected session');
    }
    expect(session.key).toMatch(/^[0-9a-f-]{36}__\.\._media.bin$/);
    controller.permitted = false;
    await rejectsWithStatus(controller.completeMultipartUpload(session.uploadId)(request(), response), 403);
  });

  it('validates upload IDs, numbering, chunk sizes and object keys', async () => {
    await rejectsWithStatus(backend.multipart.inspect('../escape', '1'), 400);
    await rejectsWithStatus(backend.multipart.inspect(randomUUID(), '1'), 404);
    await rejectsWithStatus(backend.multipart.start('../escape', '1', { size: 10 }), 400);
    await rejectsWithStatus(backend.multipart.start('x', '1', { size: 10, chunkSize: 100 }, undefined, 100), 400);
    const session = await backend.multipart.start('x', '1', { size: 3, chunkSize: 3 });
    for (const number of [0, -1, 1.5, 2]) {
      await rejectsWithStatus(backend.multipart.uploadPart(session.uploadId, '1', number, '0'.repeat(64), stream(new Uint8Array(3))), 400);
    }
  });

  it('finalizes in order, persists its response and never reruns a successful hook', async () => {
    controller.permitted = true;
    const session = await backend.multipart.start('ordered.bin', '1', { size: 11, chunkSize: 4 }, { tag: 'large' });
    const data = new TextEncoder().encode('abcdefghijk');
    for (const number of [3, 1, 2]) {
      const chunk = data.slice((number - 1) * 4, number * 4);
      await backend.multipart.uploadPart(session.uploadId, '1', number, checksum(chunk), stream(chunk));
    }
    expect(await backend.storageExists(session.key)).toBe(false);
    const first = await controller.completeMultipartUpload(session.uploadId)(request(), response);
    const second = await controller.completeMultipartUpload(session.uploadId)(request(), response);
    expect(second).toEqual(first);
    expect(await fse.promises.readFile(backend.getFileAbsPathInBucket(session.key), 'utf8')).toBe('abcdefghijk');
    expect(controller.afterFileUploadHook).toHaveBeenCalledTimes(1);
    expect(controller.afterFileUploadHook).toHaveBeenCalledWith(expect.objectContaining({ size: 11 }), { tag: 'large' });
  });

  it('reads binary Node HTTP bodies incrementally rather than form-data or JSON', async () => {
    controller.permitted = true;
    const session = await backend.multipart.start('binary-node', '1', { size: 3, chunkSize: 3 });
    const data = new Uint8Array([0, 255, 128]);
    const req = Object.assign(Readable.from([data.slice(0, 1), data.slice(1)]), {
      userId: 1, headers: { 'content-type': 'application/octet-stream', 'content-length': '3' },
    }) as ExpressRequest;
    const part = await controller.uploadMultipartPart(new Blob(), session.uploadId, '1', checksum(data))(req, response);
    expect(part).toMatchObject({ partNumber: 1, size: 3, sha256: checksum(data) });
    await controller.completeMultipartUpload(session.uploadId)(request(), response);
    expect(await fse.promises.readFile(backend.getFileAbsPathInBucket(session.key))).toEqual(Buffer.from(data));
  });

  it('passes raw Blob bodies, cancellation and authentication config through the controller client', async () => {
    const file = new File(['abcde'], 'client.bin', { type: 'application/test' });
    const session = { uploadId: randomUUID(), key: 'client-key', size: 5, chunkSize: 3, expiresAt: Date.now() + 10000 };
    const start = clientAction(controller.startMultipartUpload({ size: 5, fileName: file.name }), async () => session);
    vi.spyOn(controller, 'startMultipartUpload').mockReturnValue(start);
    const originalPart = controller.uploadMultipartPart.bind(controller);
    const chunks: Blob[] = [];
    vi.spyOn(controller, 'uploadMultipartPart').mockImplementation((chunk, id, number, sha256) =>
      clientAction(originalPart(chunk, id, number, sha256), async config => {
        expect(config.body).toBe(chunk);
        expect(config.body).toBeInstanceOf(Blob);
        expect(new Headers(config.headers).get('Authorization')).toBe('Bearer test');
        expect(config.signal).toBeInstanceOf(AbortSignal);
        chunks.push(chunk);
        return { partNumber: Number(number), size: chunk.size, sha256, etag: 'etag' };
      }));
    const complete = clientAction(controller.completeMultipartUpload(session.uploadId), async () => [{
      key: session.key, storageKey: `TestStorageController/${session.key}`, size: file.size,
    }]);
    vi.spyOn(controller, 'completeMultipartUpload').mockReturnValue(complete);
    const progress = vi.fn();
    const result = await controller.uploadFileInChunks(file, {
      chunkSize: 3, concurrency: 1, onProgress: progress, metadata: { tag: 'client' },
    }, { tag: 'query' }, { headers: { Authorization: 'Bearer test' }, body: '{"mustNotReplaceBinary":true}' });
    expect(chunks.map(chunk => chunk.size)).toEqual([3, 2]);
    expect(await new Blob(chunks).text()).toBe('abcde');
    expect(controller.startMultipartUpload).toHaveBeenCalledWith(expect.objectContaining({
      fileName: file.name, contentType: file.type, metadata: { tag: 'client' }, chunkSize: 3,
    }), { tag: 'query' });
    expect(result[0].size).toBe(5);
    expect(progress.mock.calls.at(-1)).toEqual([100]);
  });

  it('accepts identical duplicate chunks and rejects conflicting duplicates', async () => {
    const session = await backend.multipart.start('duplicate', '1', { size: 3, chunkSize: 3 });
    const data = new Uint8Array([1, 2, 3]);
    const send = () => backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    expect(await send()).toEqual(await send());
    await rejectsWithStatus(backend.multipart.uploadPart(session.uploadId, '1', 1, '0'.repeat(64), stream(data)), 409);
    const result = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(result[0].size).toBe(3);
  });

  it('rejects incomplete finalization and interrupted or corrupt chunks without publishing', async () => {
    const session = await backend.multipart.start('interrupted', '1', { size: 6, chunkSize: 3 });
    const data = new Uint8Array([1, 2, 3]);
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    await rejectsWithStatus(backend.multipart.complete(session.uploadId, '1', afterUpload), 400);
    await rejectsWithStatus(backend.multipart.uploadPart(session.uploadId, '1', 2, checksum(data), stream(data.slice(0, 2))), 422);
    await rejectsWithStatus(backend.multipart.uploadPart(session.uploadId, '1', 2, '0'.repeat(64), stream(data)), 422);
    expect(await backend.storageExists(session.key)).toBe(false);
    await backend.multipart.abort(session.uploadId, '1');
    await rejectsWithStatus(backend.multipart.complete(session.uploadId, '1', afterUpload), 410);
  });

  it('detects on-disk corruption during assembly', async () => {
    const session = await backend.multipart.start('corrupted', '1', { size: 3, chunkSize: 3 });
    const data = new Uint8Array([1, 2, 3]);
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    await fse.promises.writeFile(path.join(directory, '__taon_multipart__', 'TestStorageController', session.uploadId, '1.part'), 'bad');
    await rejectsWithStatus(backend.multipart.complete(session.uploadId, '1', afterUpload), 422);
    expect(await backend.storageExists(session.key)).toBe(false);
  });

  it('streams separate parts concurrently without losing manifest entries', async () => {
    const session = await backend.multipart.start('concurrent', '1', { size: 6, chunkSize: 3 });
    let firstReader: ReadableStreamDefaultController<Uint8Array>;
    let secondReader: ReadableStreamDefaultController<Uint8Array>;
    const first = new ReadableStream<Uint8Array>({ start: value => { firstReader = value; } });
    const second = new ReadableStream<Uint8Array>({ start: value => { secondReader = value; } });
    const data = new Uint8Array([1, 2, 3]);
    const upload1 = backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), first);
    const upload2 = backend.multipart.uploadPart(session.uploadId, '1', 2, checksum(data), second);
    firstReader.enqueue(data);
    secondReader.enqueue(data);
    firstReader.close();
    secondReader.close();
    await Promise.all([upload1, upload2]);
    const result = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(result[0].size).toBe(6);
    expect(await fse.promises.readFile(backend.getFileAbsPathInBucket(session.key))).toEqual(Buffer.from([1, 2, 3, 1, 2, 3]));
  });

  it('recovers publication after a metadata failure without invoking the hook twice', async () => {
    const session = await backend.multipart.start('recover', '1', { size: 3, chunkSize: 3 });
    const data = new Uint8Array([1, 2, 3]);
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    vi.spyOn(backend, 'storageGetMetadata').mockRejectedValueOnce(new Error('Lost response'));
    await expect(backend.multipart.complete(session.uploadId, '1', afterUpload)).rejects.toThrow('Lost response');
    expect(afterUpload).not.toHaveBeenCalled();
    const result = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(result[0].size).toBe(3);
    expect(afterUpload).toHaveBeenCalledTimes(1);
  });

  it('surfaces hook failures for reconciliation and never automatically repeats side effects', async () => {
    const session = await backend.multipart.start('hook-failed', '1', { size: 3, chunkSize: 3 });
    const data = new Uint8Array([1, 2, 3]);
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    const hook = vi.fn(async () => { throw new Error('Hook failed'); });
    await expect(backend.multipart.complete(session.uploadId, '1', hook)).rejects.toThrow('Hook failed');
    await rejectsWithStatus(backend.multipart.complete(session.uploadId, '1', hook), 500);
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('cleans abandoned Node sessions without exposing session files as objects', async () => {
    const session = await backend.multipart.start('abandoned', '1', { size: 3 });
    expect(await backend.storageList()).toEqual([]);
    expect(await backend.multipart.cleanupAbandonedUploads(session.expiresAt + 24 * 60 * 60 * 1000 + 1)).toBe(1);
    await rejectsWithStatus(backend.multipart.inspect(session.uploadId, '1'), 404);
  });

  it('retries transient failed chunks, bounds concurrency and reports final progress', async () => {
    const api = transport();
    const original = api.part;
    let attempts = 0;
    let active = 0;
    let peak = 0;
    api.part = vi.fn(async (...args: Parameters<TaonChunkedUploadTransport['part']>) => {
      active++;
      peak = Math.max(peak, active);
      try {
        if (attempts++ === 0) {
          throw { statusCode: 503 };
        }
        return await original(...args);
      } finally {
        active--;
      }
    });
    const progress = vi.fn();
    const result = await uploadFileInChunks(new Blob(['abcdefghijk']), api, {
      chunkSize: 4, concurrency: 2, retryDelayMs: 1, onProgress: progress,
    });
    expect(attempts).toBeGreaterThan(3);
    expect(peak).toBeLessThanOrEqual(2);
    expect(result[0].size).toBe(11);
    expect(progress.mock.calls[0]).toEqual([0]);
    expect(progress.mock.calls.at(-1)).toEqual([100]);
    expect(progress.mock.calls.slice(0, -1).every(([value]) => value < 100)).toBe(true);
  });

  it('cancels an in-progress upload and aborts its session', async () => {
    const api = transport();
    const cancellation = new AbortController();
    api.part = vi.fn(async () => {
      cancellation.abort();
      throw new DOMException('Cancelled', 'AbortError');
    });
    const abort = vi.spyOn(api, 'abort');
    await expect(uploadFileInChunks(new Blob(['abcdefghijk']), api, {
      chunkSize: 4, concurrency: 1, signal: cancellation.signal,
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(abort).toHaveBeenCalledTimes(1);
    expect(await backend.storageExists('large.bin')).toBe(false);
  });

  it('caps retry attempts and exposes failures of abort cleanup', async () => {
    const api = transport();
    api.part = vi.fn(async () => { throw { statusCode: 503 }; });
    api.abort = vi.fn(async () => { throw { statusCode: 403 }; });
    await expect(uploadFileInChunks(new Blob(['abcdefghijk']), api, {
      chunkSize: 4, concurrency: 1, maxRetries: 2, retryDelayMs: 0,
    })).rejects.toBeInstanceOf(AggregateError);
    expect(api.part).toHaveBeenCalledTimes(3);
    expect(api.abort).toHaveBeenCalledTimes(1);
  });

  it('uses bounded exponential backoff rather than immediate retries', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('crypto', {
      randomUUID,
      subtle: { digest: async () => new ArrayBuffer(32) },
    });
    const api = transport();
    api.start = async chunkSize => ({
      uploadId: randomUUID(), key: 'retry', size: 3, chunkSize, expiresAt: Date.now() + 10000,
    });
    api.part = vi.fn(async () => { throw new TypeError('Network unavailable'); });
    api.abort = vi.fn(async () => true);
    const failed = expect(uploadFileInChunks(new Blob(['abc']), api, {
      chunkSize: 3, concurrency: 1, maxRetries: 3, retryDelayMs: 100,
    })).rejects.toThrow('Chunk 1/1 failed: Network unavailable');
    await vi.advanceTimersByTimeAsync(99);
    expect(api.part).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(api.part).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(200);
    expect(api.part).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(400);
    expect(api.part).toHaveBeenCalledTimes(4);
    await failed;
  });

  it('chunks a file larger than the default 20 MiB without changing bytes', async () => {
    const data = new Uint8Array(TAON_MULTIPART_CHUNK_SIZE + 17);
    data[0] = 42;
    data[data.length - 1] = 99;
    const api = transport();
    api.start = chunkSize => backend.multipart.start('default-large', '1', { size: data.length, chunkSize });
    const part = vi.spyOn(api, 'part');
    await uploadFileInChunks(new Blob([data]), api, { concurrency: 1 });
    expect(part.mock.calls.map(call => call[3].size)).toEqual([TAON_MULTIPART_CHUNK_SIZE, 17]);
    expect(checksum(await fse.promises.readFile(backend.getFileAbsPathInBucket('default-large')))).toBe(checksum(data));
  });

  it('does not consume binary Cloudflare request bodies in parseBody', async () => {
    const req = new Request('https://example.test/upload', {
      method: 'POST', headers: { 'content-type': 'application/octet-stream' },
      body: new Uint8Array([0, 255, 128]),
    });
    const form = vi.spyOn(req, 'formData');
    const text = vi.spyOn(req, 'text');
    expect(await parseBody({
      method: req.method,
      headers: req.headers as import('@cloudflare/workers-types').Headers,
      formData: vi.fn<import('@cloudflare/workers-types').Request['formData']>(),
      text: () => req.text(),
    })).toBeUndefined();
    expect(req.bodyUsed).toBe(false);
    expect(form).not.toHaveBeenCalled();
    expect(text).not.toHaveBeenCalled();
  });

  const useCloudflare = (): void => {
    runtime.cloudflare = true;
    vi.stubGlobal('crypto', { subtle: webcrypto.subtle, randomUUID, DigestStream: TestDigestStream });
    vi.stubGlobal('FixedLengthStream', TestFixedLengthStream);
  };

  it('uses native R2 multipart APIs, preserves ETags and orders parts', async () => {
    useCloudflare();
    const chunkSize = 5 * 1024 * 1024;
    const data = new Uint8Array(chunkSize + 7);
    data[0] = 12;
    data[data.length - 1] = 34;
    const session = await backend.multipart.start('r2-large', '1', {
      size: data.length, chunkSize, fileName: 'video.bin',
      contentType: 'video/test', metadata: { tag: 'test' },
    });
    for (const number of [2, 1]) {
      const chunk = data.slice((number - 1) * chunkSize, number * chunkSize);
      await backend.multipart.uploadPart(session.uploadId, '1', number, checksum(chunk), stream(chunk));
    }
    expect(await backend.storageExists(session.key)).toBe(false);
    const result = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(r2.bucket.createMultipartUpload).toHaveBeenCalledTimes(1);
    expect(r2.uploadPart).toHaveBeenCalledTimes(2);
    expect(r2.complete.mock.calls[0][1].map(part => part.partNumber)).toEqual([1, 2]);
    expect(result[0]).toMatchObject({ size: data.length, contentType: 'video/test', metadata: { tag: 'test' } });
    expect(checksum(r2.records.get(backend.getFileRelativePathInBucket(session.key)).data)).toBe(checksum(data));
    const repeated = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(repeated).toEqual(result);
    expect(r2.complete).toHaveBeenCalledTimes(1);
  });

  it('enforces R2 minimum part size, aborts and cleans abandoned R2 sessions', async () => {
    useCloudflare();
    await rejectsWithStatus(backend.multipart.start('bad-r2', '1', { size: 10, chunkSize: 4 }), 400);
    const session = await backend.multipart.start('r2-abort', '1', { size: 3 });
    await backend.multipart.abort(session.uploadId, '1');
    await backend.multipart.abort(session.uploadId, '1');
    expect(r2.abort).toHaveBeenCalledTimes(1);
    const abandoned = await backend.multipart.start('r2-abandoned', '1', { size: 3 });
    await backend.multipart.cleanupAbandonedUploads(abandoned.expiresAt + 24 * 60 * 60 * 1000 + 1);
    expect(r2.abort).toHaveBeenCalledTimes(2);
    expect(r2.uploads.size).toBe(0);
  });

  it('rejects invalid R2 chunk integrity and permits a correct retry', async () => {
    useCloudflare();
    const session = await backend.multipart.start('r2-integrity', '1', { size: 3 });
    const data = new Uint8Array([1, 2, 3]);
    await rejectsWithStatus(backend.multipart.uploadPart(session.uploadId, '1', 1, '0'.repeat(64), stream(data)), 422);
    await rejectsWithStatus(backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(new Uint8Array(4))), 413);
    await rejectsWithStatus(backend.multipart.complete(session.uploadId, '1', afterUpload), 400);
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    const result = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(result[0].size).toBe(3);
    expect(r2.uploadPart).toHaveBeenCalledTimes(3);
  });

  it('reads the original Cloudflare binary stream without formData or arrayBuffer parsing', async () => {
    useCloudflare();
    controller.permitted = true;
    const session = await backend.multipart.start('binary-worker', '1', { size: 3 });
    const data = new Uint8Array([0, 255, 128]);
    const native = new Request('https://example.test/part', {
      method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: data,
    });
    const formData = vi.spyOn(native, 'formData');
    const arrayBuffer = vi.spyOn(native, 'arrayBuffer');
    const req = request();
    req.raw = native;
    req.headers['content-type'] = 'application/octet-stream';
    const part = await controller.uploadMultipartPart(new Blob(), session.uploadId, 1, checksum(data))(req, response);
    expect(part).toMatchObject({ size: 3, sha256: checksum(data) });
    expect(formData).not.toHaveBeenCalled();
    expect(arrayBuffer).not.toHaveBeenCalled();
    await controller.completeMultipartUpload(session.uploadId)(request(), response);
    expect(checksum(r2.records.get(backend.getFileRelativePathInBucket(session.key)).data)).toBe(checksum(data));
  });

  it('recovers a lost R2 completion response without repeating complete or the hook', async () => {
    useCloudflare();
    const session = await backend.multipart.start('r2-recover', '1', { size: 3 });
    const data = new Uint8Array([1, 2, 3]);
    await backend.multipart.uploadPart(session.uploadId, '1', 1, checksum(data), stream(data));
    const nativeComplete = r2.complete.getMockImplementation();
    r2.complete.mockImplementationOnce(async (...args) => {
      await nativeComplete(...args);
      throw new Error('Lost completion response');
    });
    await expect(backend.multipart.complete(session.uploadId, '1', afterUpload)).rejects.toThrow('Lost completion response');
    const result = await backend.multipart.complete(session.uploadId, '1', afterUpload);
    expect(result[0].size).toBe(3);
    expect(r2.complete).toHaveBeenCalledTimes(1);
    expect(afterUpload).toHaveBeenCalledTimes(1);
  });
});
