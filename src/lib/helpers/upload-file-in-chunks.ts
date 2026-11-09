import {
  TAON_MULTIPART_CHUNK_SIZE,
  TaonChunkedUploadOptions,
  TaonMultipartUploadPart,
  TaonMultipartUploadSession,
  TaonStorageObject,
} from '../base-classes/base-storage-models';

export interface TaonChunkedUploadTransport {
  start: (chunkSize: number) => Promise<TaonMultipartUploadSession>;
  part: (
    uploadId: string, partNumber: number, sha256: string,
    chunk: Blob, signal: AbortSignal,
  ) => Promise<TaonMultipartUploadPart>;
  complete: (uploadId: string) => Promise<TaonStorageObject[]>;
  abort: (uploadId: string) => Promise<boolean>;
}

const cancelledError = (): Error => new DOMException('Upload cancelled.', 'AbortError');

const retryable = (error: unknown): boolean => {
  const status = typeof error === 'object' && error !== null && 'statusCode' in error
    ? Number(error.statusCode) : undefined;
  return error instanceof TypeError || status === 408 || status === 409 ||
    status === 429 || (status >= 500 && status <= 599);
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'body' in error &&
    typeof error.body === 'object' && error.body !== null && 'json' in error.body &&
    typeof error.body.json === 'object' && error.body.json !== null &&
    'message' in error.body.json && typeof error.body.json.message === 'string') {
    return error.body.json.message;
  }
  return 'The server rejected the chunk request.';
};

const wait = (milliseconds: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(cancelledError());
      return;
    }
    const abort = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(cancelledError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });

/**
 * Invoke from an Angular API service. Progress reflects acknowledged bytes;
 * 100% is emitted only after the server has finalized the object and hook.
 */
export const uploadFileInChunks = async (
  file: Blob,
  transport: TaonChunkedUploadTransport,
  options: TaonChunkedUploadOptions = {},
): Promise<TaonStorageObject[]> => {
  const chunkSize = options.chunkSize ?? TAON_MULTIPART_CHUNK_SIZE;
  const concurrency = options.concurrency ?? 3;
  const maxRetries = options.maxRetries ?? 5;
  const retryDelayMs = options.retryDelayMs ?? 500;
  if (
    file.size <= 0 || !Number.isSafeInteger(chunkSize) || chunkSize <= 0 ||
    !Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8 ||
    !Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10 ||
    !Number.isFinite(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 30000
  ) {
    throw new Error('Invalid file size, chunk size, concurrency or retry configuration.');
  }
  const controller = new AbortController();
  const cancel = (): void => controller.abort();
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) {
    controller.abort();
  }
  const checkCancellation = (): void => {
    if (controller.signal.aborted) {
      throw cancelledError();
    }
  };
  const retry = async <T>(
    action: () => Promise<T>, signal?: AbortSignal,
  ): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
      if (signal?.aborted) {
        throw cancelledError();
      }
      try {
        return await action();
      } catch (error) {
        if (signal?.aborted) {
          throw cancelledError();
        }
        if (attempt >= maxRetries || !retryable(error)) {
          throw error;
        }
        await wait(Math.min(30000, retryDelayMs * 2 ** attempt), signal);
      }
    }
  };
  let session: TaonMultipartUploadSession;
  let committed = false;
  try {
    checkCancellation();
    options.onProgress?.(0);
    // Do not discard the session ID if cancellation races with initialization.
    session = await transport.start(chunkSize);
    checkCancellation();
    if (session.size !== file.size || session.chunkSize !== chunkSize) {
      throw new Error('Server returned an incompatible upload session.');
    }
    const count = Math.ceil(file.size / chunkSize);
    let next = 1;
    let acknowledged = 0;
    let failure: unknown;
    const worker = async (): Promise<void> => {
      try {
        while (next <= count) {
          checkCancellation();
          const partNumber = next++;
          const chunk = file.slice((partNumber - 1) * chunkSize, partNumber * chunkSize);
          const digest = await crypto.subtle.digest('SHA-256', await chunk.arrayBuffer());
          const sha256 = Array.from(new Uint8Array(digest), byte =>
            byte.toString(16).padStart(2, '0')).join('');
          checkCancellation();
          const part = await retry(
            () => transport.part(session.uploadId, partNumber, sha256, chunk, controller.signal),
            controller.signal,
          ).catch(error => {
            if (controller.signal.aborted) {
              throw cancelledError();
            }
            throw new Error(`Chunk ${partNumber}/${count} failed: ${errorMessage(error)}`, { cause: error });
          });
          if (part.partNumber !== partNumber || part.size !== chunk.size || part.sha256 !== sha256) {
            throw new Error(`Server returned invalid integrity metadata for chunk ${partNumber}.`);
          }
          acknowledged += chunk.size;
          options.onProgress?.(Math.min(99, acknowledged / file.size * 100));
        }
      } catch (error) {
        if (failure === undefined) {
          failure = error;
        }
        controller.abort();
        throw error;
      }
    };
    await Promise.allSettled(Array.from({ length: Math.min(concurrency, count) }, worker));
    if (failure !== undefined) {
      throw failure;
    }
    checkCancellation();
    // Completion is a commit point. Do not interrupt it and report a cancelled
    // upload when the server may already have successfully published it.
    const result = await retry(() => transport.complete(session.uploadId));
    committed = true;
    if (result.length !== 1 || result[0].size !== file.size || result[0].key !== session.key) {
      throw new Error('Server returned invalid completed upload metadata.');
    }
    options.onProgress?.(100);
    return result;
  } catch (error) {
    controller.abort();
    if (session && !committed) {
      try {
        await retry(() => transport.abort(session.uploadId));
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          `Upload failed and session ${session.uploadId} could not be aborted; server cleanup or reconciliation is required.`,
        );
      }
    }
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', cancel);
  }
};
