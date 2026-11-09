//#region imports

import { createHash } from 'node:crypto'; // @esmRemove @backend
import { Readable } from 'node:stream'; // @esmRemove @backend
import { pipeline } from 'node:stream/promises'; // @esmRemove @backend

import type {
  DigestStream,
  FixedLengthStream,
} from '@cloudflare/workers-types';
import { fse, path, UtilsOs } from 'tnp-core/src';

import { Taon } from '../index';

import type { TaonBaseStorageBackend } from './base-storage-backend';
import {
  TAON_MULTIPART_CHUNK_SIZE,
  TaonMultipartUploadOptions,
  TaonMultipartUploadPart,
  TaonMultipartUploadSession,
  TaonStorageObject,
} from './base-storage-models';
//#endregion

//#region models / multiparet state
type MultipartState<QUERY> = TaonMultipartUploadSession & {
  owner: string;
  options: TaonMultipartUploadOptions;
  queryParams?: QUERY;
  nativeUploadId?: string;
  parts: Record<string, TaonMultipartUploadPart>;
  status:
    | 'open'
    | 'finalizing'
    | 'published'
    | 'hook-running'
    | 'hook-failed'
    | 'completed'
    | 'aborted';
  result?: TaonStorageObject[];
};
//#endregion

/**
 * Session records live outside controller object namespaces. Mutations use
 * exclusive filesystem/R2 locks, including across processes and Workers.
 */
export class TaonStorageMultipartBackend {
  constructor(
    private readonly storage: TaonBaseStorageBackend,
    private readonly bucketDirectory: () => string,
  ) {}

  //#region methods / session key
  private sessionKey(uploadId: string): string {
    //#region @backendFunc
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        uploadId,
      )
    ) {
      Taon.error({ message: 'Invalid multipart upload ID.', status: 400 });
    }
    return `__taon_multipart__/${this.storage.getFileRelativePathInBucket('')}/${uploadId}`;
    //#endregion
  }
  //#endregion

  //#region methods / node path
  private nodePath(key: string): string {
    //#region @backendFunc
    //#region @esmRemove
    return path.join(this.bucketDirectory(), key);
    //#endregion
    return void 0 as any;
    //#endregion
  }
  //#endregion

  //#region methods / start
  async start<QUERY>(
    key: string,
    owner: string,
    options: TaonMultipartUploadOptions,
    queryParams?: QUERY,
    maxRequestBytes = 100_000_000,
  ): Promise<TaonMultipartUploadSession> {
    //#region @backendFunc
    const chunkSize = options.chunkSize ?? TAON_MULTIPART_CHUNK_SIZE;
    if (
      !owner ||
      !Number.isSafeInteger(options.size) ||
      options.size <= 0 ||
      !Number.isSafeInteger(chunkSize) ||
      chunkSize <= 0 ||
      !Number.isSafeInteger(maxRequestBytes) ||
      chunkSize >= maxRequestBytes ||
      Math.ceil(options.size / chunkSize) > 10000 ||
      (UtilsOs.isRunningInCloudflareWorker() &&
        ((options.size > chunkSize && chunkSize < 5 * 1024 * 1024) ||
          chunkSize > 5 * 1024 * 1024 * 1024 ||
          options.size > 5 * 1024 * 1024 * 1024 * 1024))
    ) {
      Taon.error({
        message:
          'Invalid upload size or chunk size (request limit/R2 part limits).',
        status: 400,
      });
    }
    key = this.storage.normalizeKey(key);
    if (!key || key.includes('\0') || key.endsWith('.taon-meta.json')) {
      Taon.error({ message: 'Invalid multipart storage key.', status: 400 });
    }
    if (
      (options.contentType !== undefined &&
        typeof options.contentType !== 'string') ||
      (options.fileName !== undefined &&
        typeof options.fileName !== 'string') ||
      (options.metadata !== undefined &&
        (!options.metadata ||
          typeof options.metadata !== 'object' ||
          Array.isArray(options.metadata) ||
          Object.values(options.metadata).some(
            value => typeof value !== 'string',
          ) ||
          '_taonMultipartUploadId' in options.metadata)) ||
      new TextEncoder().encode(JSON.stringify(options.metadata || {}))
        .byteLength > 1800
    ) {
      Taon.error({
        message: 'Invalid upload metadata (maximum 1800 UTF-8 bytes).',
        status: 400,
      });
    }
    if (await this.storage.storageExists(key)) {
      Taon.error({
        message: 'Multipart uploads cannot replace an existing storage object.',
        status: 409,
      });
    }
    const uploadId = crypto.randomUUID();
    const customMetadata = {
      ...options.metadata,
      ...(options.fileName ? { fileName: options.fileName } : {}),
      _taonMultipartUploadId: uploadId,
    };
    if (
      new TextEncoder().encode(JSON.stringify(customMetadata)).byteLength > 2000
    ) {
      Taon.error({
        message: 'Upload filename and metadata exceed the R2 metadata limit.',
        status: 400,
      });
    }
    const session: MultipartState<QUERY> = {
      uploadId,
      key,
      owner,
      size: options.size,
      chunkSize,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      options: { ...options, chunkSize },
      queryParams,
      parts: {},
      status: 'open',
    };
    if (UtilsOs.isRunningInCloudflareWorker()) {
      const native = await this.storage.cloudflareBucket.createMultipartUpload(
        this.storage.getFileRelativePathInBucket(key),
        {
          httpMetadata: { contentType: options.contentType },
          customMetadata,
        },
      );
      session.nativeUploadId = native.uploadId;
      try {
        await this.save(session);
      } catch (error) {
        await native.abort();
        throw error;
      }
    } else {
      await this.save(session);
    }
    return {
      uploadId,
      key,
      size: session.size,
      chunkSize,
      expiresAt: session.expiresAt,
    };
    //#endregion
  }
  //#endregion

  //#region methods / inspect
  async inspect<QUERY>(
    uploadId: string,
    owner: string,
  ): Promise<{
    key: string;
    options: TaonMultipartUploadOptions;
    queryParams?: QUERY;
  }> {
    //#region @backendFunc
    const session = await this.load<QUERY>(uploadId, owner);
    return {
      key: session.key,
      options: session.options,
      queryParams: session.queryParams,
    };
    //#endregion
  }
  //#endregion

  //#region methods / load
  private async load<QUERY>(
    uploadId: string,
    owner?: string,
  ): Promise<MultipartState<QUERY>> {
    //#region @backendFunc
    const key = `${this.sessionKey(uploadId)}/session.json`;
    let session: MultipartState<QUERY>;
    if (UtilsOs.isRunningInCloudflareWorker()) {
      const object = await this.storage.cloudflareBucket.get(key);
      if (!object) {
        Taon.error({ message: 'Multipart upload not found.', status: 404 });
      }
      session = await object.json<MultipartState<QUERY>>();
    } else {
      //#region @esmRemove
      try {
        session = JSON.parse(
          await fse.promises.readFile(this.nodePath(key), 'utf8'),
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          Taon.error({ message: 'Multipart upload not found.', status: 404 });
        }
        throw error;
      }
      //#endregion
    }
    if (owner !== undefined && (!owner || session.owner !== owner)) {
      Taon.error({
        message: 'This multipart upload belongs to another user.',
        status: 403,
      });
    }
    if (owner !== undefined && session.expiresAt <= Date.now()) {
      Taon.error({ message: 'Multipart upload expired.', status: 410 });
    }
    for (const object of session.result || []) {
      if (object.lastModified) {
        object.lastModified = new Date(object.lastModified);
      }
    }
    return session;
    //#endregion
  }
  //#endregion

  //#region methods / save
  private async save<QUERY>(session: MultipartState<QUERY>): Promise<void> {
    //#region @backendFunc
    const key = `${this.sessionKey(session.uploadId)}/session.json`;
    if (UtilsOs.isRunningInCloudflareWorker()) {
      await this.storage.cloudflareBucket.put(key, JSON.stringify(session));
      return;
    }
    //#region @esmRemove
    const destination = this.nodePath(key);
    await fse.promises.mkdir(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
    try {
      await fse.promises.writeFile(temporary, JSON.stringify(session), {
        flag: 'wx',
      });
      await fse.promises.rename(temporary, destination);
    } finally {
      await fse.remove(temporary);
    }
    //#endregion
    //#endregion
  }
  //#endregion

  //#region methods / locked
  private async locked<T>(
    uploadId: string,
    action: () => Promise<T>,
    suffix = 'lock',
    wait = false,
  ): Promise<T> {
    //#region @backendFunc
    const key = `${this.sessionKey(uploadId)}/${suffix}`;
    const acquire = async (): Promise<(() => Promise<void>) | undefined> => {
      if (UtilsOs.isRunningInCloudflareWorker()) {
        const lock = await this.storage.cloudflareBucket.put(
          key,
          String(Date.now()),
          {
            onlyIf: { etagDoesNotMatch: '*' },
          },
        );
        return lock
          ? async () => {
              await this.storage.cloudflareBucket.delete(key);
            }
          : undefined;
      }
      //#region @esmRemove
      const lockPath = this.nodePath(key);
      let lock: Awaited<ReturnType<typeof fse.promises.open>>;
      try {
        lock = await fse.promises.open(lockPath, 'wx');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
          return undefined;
        }
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          Taon.error({ message: 'Multipart upload not found.', status: 404 });
        }
        throw error;
      }
      return async () => {
        await lock.close();
        await fse.promises.unlink(lockPath);
      };
      //#endregion
    };
    let release: () => Promise<void>;
    for (let attempt = 0; ; attempt++) {
      release = await acquire();
      if (release) {
        break;
      }
      if (!wait || attempt >= 250) {
        Taon.error({
          message: 'Multipart upload is busy. Retry this request.',
          status: 409,
        });
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    try {
      return await action();
    } finally {
      await release();
    }
    //#endregion
  }
  //#endregion

  //#region methods / upload part
  async uploadPart(
    uploadId: string,
    owner: string,
    partNumber: number,
    sha256: string,
    body: ReadableStream<Uint8Array>,
  ): Promise<TaonMultipartUploadPart> {
    //#region @backendFunc
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000) {
      Taon.error({ message: 'Invalid multipart part number.', status: 400 });
    }
    return this.locked(
      uploadId,
      async () => {
        const session = await this.load(uploadId, owner);
        const count = Math.ceil(session.size / session.chunkSize);
        if (
          session.status !== 'open' ||
          !Number.isInteger(partNumber) ||
          partNumber < 1 ||
          partNumber > count ||
          typeof sha256 !== 'string' ||
          !/^[0-9a-f]{64}$/.test(sha256)
        ) {
          Taon.error({
            message: 'Invalid multipart part or upload is no longer open.',
            status: 400,
          });
        }
        const previous = session.parts[String(partNumber)];
        if (previous && previous.sha256 !== sha256) {
          Taon.error({
            message: 'A different chunk already occupies this part number.',
            status: 409,
          });
        }
        if (previous) {
          await this.verifyDuplicate(previous, body);
          return previous;
        }
        const size = Math.min(
          session.chunkSize,
          session.size - (partNumber - 1) * session.chunkSize,
        );
        let etag: string;
        if (UtilsOs.isRunningInCloudflareWorker()) {
          etag = await this.uploadCloudflarePart(
            session,
            partNumber,
            size,
            sha256,
            body,
          );
        } else {
          etag = await this.uploadNodePart(
            session,
            partNumber,
            size,
            sha256,
            body,
          );
        }
        const part = { partNumber, size, sha256, etag };
        await this.locked(
          uploadId,
          async () => {
            const latest = await this.load(uploadId, owner);
            if (latest.status !== 'open') {
              Taon.error({
                message: 'Upload was aborted or is no longer open.',
                status: 410,
              });
            }
            latest.parts[String(partNumber)] = part;
            await this.save(latest);
          },
          'lock',
          true,
        );
        return part;
      },
      `part-${partNumber}.lock`,
    );
    //#endregion
  }
  //#endregion

  //#region methods / verify duplicate
  private async verifyDuplicate(
    part: TaonMultipartUploadPart,
    body: ReadableStream<Uint8Array>,
  ): Promise<void> {
    //#region @backendFunc
    let received = 0;
    const measured = body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(value, controller) {
          received += value.byteLength;
          if (received > part.size) {
            Taon.error({
              message: 'Chunk exceeds its declared size.',
              status: 413,
            });
          }
          controller.enqueue(value);
        },
        flush() {
          if (received !== part.size) {
            Taon.error({ message: 'Chunk size mismatch.', status: 422 });
          }
        },
      }),
    );
    let sha256: string;
    if (UtilsOs.isRunningInCloudflareWorker()) {
      const workerCrypto = crypto as Crypto & {
        DigestStream: typeof DigestStream;
      };
      const digest = new workerCrypto.DigestStream('SHA-256');
      const [piped, hashed] = await Promise.allSettled([
        measured.pipeTo(digest),
        digest.digest,
      ]);
      if (piped.status === 'rejected') {
        throw piped.reason;
      }
      if (hashed.status === 'rejected') {
        throw hashed.reason;
      }
      sha256 = this.hex(hashed.value);
    } else {
      //#region @esmRemove
      const hash = createHash('sha256');
      await measured.pipeTo(
        new WritableStream({
          write: value => {
            hash.update(value);
          },
        }),
      );
      sha256 = hash.digest('hex');
      //#endregion
    }
    if (sha256 !== part.sha256) {
      Taon.error({ message: 'Chunk SHA-256 checksum mismatch.', status: 422 });
    }
    //#endregion
  }
  //#endregion

  //#region methods / upload cloudflare part
  private async uploadCloudflarePart(
    session: MultipartState<unknown>,
    partNumber: number,
    size: number,
    sha256: string,
    body: ReadableStream<Uint8Array>,
  ): Promise<string> {
    //#region @backendFunc
    const workerCrypto = crypto as Crypto & {
      DigestStream: typeof DigestStream;
    };
    const workerGlobal = globalThis as typeof globalThis & {
      FixedLengthStream: typeof FixedLengthStream;
    };
    const digest = new workerCrypto.DigestStream('SHA-256');
    const hashWriter = digest.getWriter();
    const fixed = new workerGlobal.FixedLengthStream(size);
    const writer = fixed.writable.getWriter();
    const reader = body.getReader();
    const transfer = async (): Promise<void> => {
      let received = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          received += value.byteLength;
          if (received > size) {
            Taon.error({
              message: 'Chunk exceeds its declared size.',
              status: 413,
            });
          }
          await hashWriter.write(value);
          await writer.write(value);
        }
        await hashWriter.close();
        if (received !== size || this.hex(await digest.digest) !== sha256) {
          Taon.error({
            message: 'Chunk size or SHA-256 checksum mismatch.',
            status: 422,
          });
        }
        await writer.close();
      } catch (error) {
        await Promise.allSettled([
          writer.abort(error),
          hashWriter.abort(error),
          reader.cancel(error),
        ]);
        throw error;
      } finally {
        reader.releaseLock();
      }
    };
    const native = this.storage.cloudflareBucket.resumeMultipartUpload(
      this.storage.getFileRelativePathInBucket(session.key),
      session.nativeUploadId,
    );
    const sending = transfer();
    const uploading = native
      .uploadPart(partNumber, fixed.readable)
      .catch(async error => {
        await reader.cancel(error);
        await writer.abort(error);
        throw error;
      });
    const [part, sent] = await Promise.allSettled([
      uploading,
      sending,
      digest.digest,
    ]);
    if (part.status === 'rejected') {
      throw part.reason;
    }
    if (sent.status === 'rejected') {
      throw sent.reason;
    }
    return part.value.etag;
    //#endregion
  }
  //#endregion

  //#region methods / hex
  private hex(value: ArrayBuffer): string {
    //#region @backendFunc
    return Array.from(new Uint8Array(value), byte =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    //#endregion
  }
  //#endregion

  //#region methods / upload node part
  private async uploadNodePart(
    session: MultipartState<unknown>,
    partNumber: number,
    size: number,
    sha256: string,
    body: ReadableStream<Uint8Array>,
  ): Promise<string> {
    //#region @backendFunc
    //#region @esmRemove
    const destination = this.nodePath(
      `${this.sessionKey(session.uploadId)}/${partNumber}.part`,
    );
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
    const hash = createHash('sha256');
    const reader = body.getReader();
    async function* chunks(): AsyncGenerator<Uint8Array> {
      let received = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          received += value.byteLength;
          if (received > size) {
            Taon.error({
              message: 'Chunk exceeds its declared size.',
              status: 413,
            });
          }
          hash.update(value);
          yield value;
        }
        if (received !== size || hash.digest('hex') !== sha256) {
          Taon.error({
            message: 'Chunk size or SHA-256 checksum mismatch.',
            status: 422,
          });
        }
      } finally {
        await reader.cancel();
        reader.releaseLock();
      }
    }
    try {
      await pipeline(
        Readable.from(chunks()),
        fse.createWriteStream(temporary, { flags: 'wx' }),
      );
      await fse.promises.rename(temporary, destination);
      return sha256;
    } finally {
      await fse.remove(temporary);
    }
    //#endregion
    return void 0 as any;
    //#endregion
  }
  //#endregion

  //#region methods / complete
  async complete<QUERY>(
    uploadId: string,
    owner: string,
    afterUpload: (
      object: TaonStorageObject,
      queryParams?: QUERY,
    ) => Promise<TaonStorageObject[]>,
  ): Promise<TaonStorageObject[]> {
    //#region @backendFunc
    return this.locked(uploadId, async () => {
      const session = await this.load<QUERY>(uploadId, owner);
      if (session.status === 'completed') {
        return session.result;
      }
      if (
        session.status === 'hook-running' ||
        session.status === 'hook-failed'
      ) {
        Taon.error({
          message:
            'Upload was published but its hook needs operator reconciliation. It will not be invoked twice.',
          status: 500,
        });
      }
      if (session.status === 'aborted') {
        Taon.error({ message: 'Multipart upload was aborted.', status: 410 });
      }
      const count = Math.ceil(session.size / session.chunkSize);
      const parts = Array.from(
        { length: count },
        (_, index) => session.parts[String(index + 1)],
      );
      if (
        parts.some(part => !part) ||
        parts.reduce((sum, part) => sum + part.size, 0) !== session.size
      ) {
        Taon.error({
          message: 'Cannot finalize an incomplete multipart upload.',
          status: 400,
        });
      }
      if (session.status !== 'published') {
        // Persist intent before publication so a lost completion response is recoverable.
        const recovering = session.status === 'finalizing';
        session.status = 'finalizing';
        await this.save(session);
        if (UtilsOs.isRunningInCloudflareWorker()) {
          const key = this.storage.getFileRelativePathInBucket(session.key);
          const existing = recovering
            ? await this.storage.cloudflareBucket.head(key)
            : null;
          if (!existing) {
            const object = await this.storage.cloudflareBucket
              .resumeMultipartUpload(key, session.nativeUploadId)
              .complete(
                parts.map(part => ({
                  partNumber: part.partNumber,
                  etag: part.etag,
                })),
              );
            if (object.size !== session.size) {
              await this.storage.cloudflareBucket.delete(key);
              Taon.error({
                message: 'R2 completed object size mismatch.',
                status: 422,
              });
            }
          } else if (
            existing.size !== session.size ||
            existing.customMetadata?.['_taonMultipartUploadId'] !==
              session.uploadId
          ) {
            Taon.error({
              message:
                'Cannot recover multipart publication: object identity or size mismatch.',
              status: 422,
            });
          }
        } else {
          await this.publishNode(session, parts, recovering);
        }
        session.status = 'published';
        await this.save(session);
      }
      const object = await this.storage.storageGetMetadata(session.key);
      if (!object || object.size !== session.size) {
        Taon.error({
          message: 'Completed upload metadata is missing or invalid.',
          status: 500,
        });
      }
      // External hook side effects cannot be transactionally committed with R2.
      session.status = 'hook-running';
      await this.save(session);
      try {
        session.result = await afterUpload(object, session.queryParams);
      } catch (error) {
        session.status = 'hook-failed';
        await this.save(session);
        throw error;
      }
      session.status = 'completed';
      await this.save(session);
      await this.removeParts(session);
      return session.result;
    });
    //#endregion
  }
  //#endregion

  //#region methods / publish node
  private async publishNode(
    session: MultipartState<unknown>,
    parts: TaonMultipartUploadPart[],
    recovering: boolean,
  ): Promise<void> {
    //#region @backendFunc
    //#region @esmRemove
    const directory = this.nodePath(this.sessionKey(session.uploadId));
    const assembled = path.join(directory, 'assembled');
    const destination = this.storage.getFileAbsPathInBucket(session.key);
    if (recovering && (await this.storage.storageExists(session.key))) {
      const metadata = JSON.parse(
        await fse.promises.readFile(`${destination}.taon-meta.json`, 'utf8'),
      );
      if (metadata.multipartUploadId !== session.uploadId) {
        Taon.error({
          message:
            'Cannot recover multipart publication: object identity mismatch.',
          status: 422,
        });
      }
    }
    async function* chunks(): AsyncGenerator<Buffer> {
      for (const part of parts) {
        const hash = createHash('sha256');
        let size = 0;
        for await (const chunk of fse.createReadStream(
          path.join(directory, `${part.partNumber}.part`),
        )) {
          size += chunk.length;
          hash.update(chunk);
          yield chunk;
        }
        if (size !== part.size || hash.digest('hex') !== part.sha256) {
          Taon.error({
            message: 'Stored chunk integrity check failed.',
            status: 422,
          });
        }
      }
    }
    try {
      await pipeline(Readable.from(chunks()), fse.createWriteStream(assembled));
      const stat = await fse.promises.stat(assembled);
      if (stat.size !== session.size) {
        Taon.error({ message: 'Assembled file size mismatch.', status: 422 });
      }
      await fse.promises.mkdir(path.dirname(destination), { recursive: true });
      await fse.promises.writeFile(
        `${assembled}.taon-meta.json`,
        JSON.stringify({
          fileName: session.options.fileName,
          contentType: session.options.contentType,
          metadata: session.options.metadata,
          multipartUploadId: session.uploadId,
        }),
      );
      await fse.promises.rename(
        `${assembled}.taon-meta.json`,
        `${destination}.taon-meta.json`,
      );
      await fse.promises.rename(assembled, destination);
    } finally {
      await fse.remove(assembled);
      await fse.remove(`${assembled}.taon-meta.json`);
    }
    //#endregion
    //#endregion
  }
  //#endregion

  //#region methods / abort
  async abort(uploadId: string, owner: string): Promise<boolean> {
    //#region @backendFunc
    return this.locked(uploadId, async () => {
      const session = await this.load(uploadId, owner);
      if (session.status === 'aborted') {
        return true;
      }
      if (session.status !== 'open') {
        Taon.error({
          message: 'A finalizing or published upload cannot be aborted.',
          status: 409,
        });
      }
      if (UtilsOs.isRunningInCloudflareWorker()) {
        await this.storage.cloudflareBucket
          .resumeMultipartUpload(
            this.storage.getFileRelativePathInBucket(session.key),
            session.nativeUploadId,
          )
          .abort();
      }
      session.status = 'aborted';
      await this.save(session);
      await this.removeParts(session);
      return true;
    });
    //#endregion
  }
  //#endregion

  //#region methods / remove parts
  private async removeParts(session: MultipartState<unknown>): Promise<void> {
    //#region @backendFunc
    if (UtilsOs.isRunningInCloudflareWorker()) {
      return;
    }
    //#region @esmRemove
    const directory = this.nodePath(this.sessionKey(session.uploadId));
    for (const name of await fse.promises.readdir(directory)) {
      if (
        name !== 'session.json' &&
        name !== 'lock' &&
        !name.endsWith('.lock')
      ) {
        await fse.remove(path.join(directory, name));
      }
    }
    //#endregion
    //#endregion
  }
  //#endregion

  //#region methods / cleanup abandoned uploads
  /**
   * Run from a scheduled backend job. Expired sessions and crashed locks are
   * reclaimed after 48 hours; request lifetimes must be shorter than this.
   * Uncertain publication/hook states are retained for operator reconciliation.
   */
  async cleanupAbandonedUploads(now = Date.now()): Promise<number> {
    //#region @backendFunc
    const prefix = `__taon_multipart__/${this.storage.getFileRelativePathInBucket('')}/`;
    const uploadIds: string[] = [];
    if (UtilsOs.isRunningInCloudflareWorker()) {
      let cursor: string | undefined;
      do {
        const listed = await this.storage.cloudflareBucket.list({
          prefix,
          cursor,
        });
        for (const object of listed.objects) {
          if (object.key.endsWith('/session.json')) {
            uploadIds.push(object.key.slice(prefix.length).split('/')[0]);
          }
        }
        cursor = listed.truncated ? listed.cursor : undefined;
      } while (cursor);
    } else {
      //#region @esmRemove
      try {
        uploadIds.push(...(await fse.promises.readdir(this.nodePath(prefix))));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
      //#endregion
    }
    let removed = 0;
    for (const uploadId of uploadIds) {
      const session = await this.load(uploadId);
      if (session.expiresAt + 24 * 60 * 60 * 1000 > now) {
        continue;
      }
      if (
        session.status === 'hook-running' ||
        session.status === 'hook-failed' ||
        session.status === 'finalizing'
      ) {
        console.error(
          `Multipart upload ${uploadId} needs operator reconciliation (${session.status}).`,
        );
        continue;
      }
      if (UtilsOs.isRunningInCloudflareWorker()) {
        if (session.status === 'open') {
          await this.storage.cloudflareBucket
            .resumeMultipartUpload(
              this.storage.getFileRelativePathInBucket(session.key),
              session.nativeUploadId,
            )
            .abort();
        }
        let cursor: string | undefined;
        do {
          const listed = await this.storage.cloudflareBucket.list({
            prefix: `${this.sessionKey(uploadId)}/`,
            cursor,
          });
          await this.storage.cloudflareBucket.delete(
            listed.objects.map(object => object.key),
          );
          cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
      } else {
        //#region @esmRemove
        await fse.remove(this.nodePath(this.sessionKey(uploadId)));
        //#endregion
      }
      removed++;
    }
    return removed;
    //#endregion
  }
  //#endregion
}
