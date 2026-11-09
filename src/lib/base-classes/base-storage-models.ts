//#region models

export type TaonStorageUploadData =
  | string
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | Blob
  | ReadableStream<Uint8Array>;

export interface TaonStorageObject {
  /**
   * Key relative to this controller storage.
   *
   * Example:
   *   avatars/user-123.png
   */
  key: string;

  /**
   * Full internal storage key.
   *
   * Example:
   *   UserController/avatars/user-123.png
   */
  storageKey: string;

  /**
   * Original file name if known.
   */
  fileName?: string;

  /**
   * MIME type.
   *
   * Example:
   *   image/png
   *   video/mp4
   */
  contentType?: string;

  /**
   * Size in bytes.
   */
  size: number;

  /**
   * Last modification date.
   */
  lastModified?: Date;

  /**
   * Optional ETag.
   *
   * Especially useful for R2.
   */
  etag?: string;

  /**
   * Optional custom metadata.
   */
  metadata?: Record<string, string>;

  /**
   * Optional short-lived download URL returned by upload controllers.
   */
  downloadUrl?: string;
}

export interface TaonStorageUploadOptions {
  contentType?: string;
  fileName?: string;
  metadata?: Record<string, string>;
}

export const TAON_MULTIPART_CHUNK_SIZE = 20 * 1024 * 1024;

export interface TaonMultipartUploadOptions extends TaonStorageUploadOptions {
  size: number;
  chunkSize?: number;
}

export interface TaonMultipartUploadSession {
  uploadId: string;
  key: string;
  size: number;
  chunkSize: number;
  expiresAt: number;
}

export interface TaonMultipartUploadPart {
  partNumber: number;
  size: number;
  sha256: string;
  etag: string;
}

export interface TaonChunkedUploadOptions extends TaonStorageUploadOptions {
  chunkSize?: number;
  concurrency?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  signal?: AbortSignal;
  onProgress?: (percentage: number) => void;
}

export interface TaonStorageListOptions {
  prefix?: string;
  limit?: number;
}

export interface TaonStorageDownloadUrlOptions {
  expiresInSeconds?: number;
}

export interface TaonStorageCopyOptions {
  /**
   * Replace destination if it already exists.
   */
  overwrite?: boolean;
}

export interface TaonStorageMoveOptions {
  /**
   * Replace destination if it already exists.
   */
  overwrite?: boolean;
}

export interface TaonStoragePrivateUrlOptions {
  /**
   * How long generated URL should remain valid.
   *
   * Default: 1 hour.
   */
  expiresInSeconds?: number;
}

export interface TaonStorageDeleteManyResult {
  deleted: string[];
  notFound: string[];
}

//#endregion
