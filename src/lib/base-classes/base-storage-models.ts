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
}

export interface TaonStorageUploadOptions {
  contentType?: string;
  fileName?: string;
  metadata?: Record<string, string>;
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
