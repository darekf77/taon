//#region imports
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises'; // @esmRemove

import { R2Bucket } from '@cloudflare/workers-types';
import type { Dirent } from 'fs-extra';
import { fse, GlobalStorage, path } from 'tnp-core/src';
import { crossPlatformPath, UtilsOs } from 'tnp-core/src';

import { TaonController } from '../decorators/classes/controller-decorator';
import { ClassHelpers } from '../helpers/class-helpers';
import { TaonUploadedFile } from '../helpers/express-request-to-form-data';
import { Body, DELETE, GET, POST, Query, Taon } from '../index';

import { TaonBaseController } from './base-controller';
import { TaonBaseStorageController } from './base-storage-controller';
import {
  TaonStorageCopyOptions,
  TaonStorageListOptions,
  TaonStorageMoveOptions,
  TaonStorageObject,
  TaonStorageUploadData,
  TaonStorageUploadOptions,
} from './base-storage-models';
//#endregion

export class TaonBaseStorageBackend {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private get ctx() {
    return this.ctrl.ctx;
  }

  constructor(private ctrl: TaonBaseStorageController) {}

  //#region methods / path helpers

  //#region path helpers/ get file relative path in bucket
  /**
   * Internal storage key.
   *
   * Example:
   * UserController/avatar/user-1.png
   */
  getFileRelativePathInBucket(fileRelativePath: string): string {
    return crossPlatformPath([
      ClassHelpers.getName(this.ctrl),
      this.normalizeKey(fileRelativePath),
    ]);
  }
  //#endregion

  //#region path helpers / get fiel abs path in bucket
  /**
   * Node:
   *
   * <cwd>/databases/bucket/UserController/avatar/user-1.png
   *
   * Cloudflare:
   *
   * UserController/avatar/user-1.png
   */
  getFileAbsPathInBucket(fileRelativePath: string): string {
    if (UtilsOs.isRunningInCloudflareWorker()) {
      return this.getFileRelativePathInBucket(fileRelativePath);
    }

    return crossPlatformPath([
      this.ctx.bucketFileDbLocationBase,
      this.getFileRelativePathInBucket(fileRelativePath),
    ]);
  }
  //#endregion

  //#region path helpers / normalize key
  normalizeKey(key: string): string {
    const normalized = key
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');
    if (normalized.split('/').some(part => part === '.' || part === '..')) {
      Taon.error({
        message: 'Invalid storage key.',
        status: 400,
      });
    }
    return normalized;
  }
  //#endregion

  //#endregion

  //#region methods / cloudflare bucket
  /**
   * Adjust this getter to however you expose bindings
   * from your Taon Cloudflare context.
   *
   * Example:
   *
   * env.MY_BUCKET
   * ctx.env.MY_BUCKET
   * ctx.cloudflare.env.MY_BUCKET
   */
  get cloudflareBucket(): R2Bucket {
    //#region @backendFunc
    const bucket = this.ctx.R2;

    if (!bucket) {
      Taon.error({
        message: `${ClassHelpers.getName(this)}: Cloudflare R2 bucket is not configured.`,
        status: 500,
      });
    }

    return bucket;
    //#endregion
  }

  //#endregion

  //#region methods / upload storage
  async storageUpload(
    key: string,
    data: TaonStorageUploadData,
    options: TaonStorageUploadOptions = {},
  ): Promise<void> {
    //#region @backendFunc

    key = this.normalizeKey(key);

    if (UtilsOs.isRunningInCloudflareWorker()) {
      await this.uploadCloudflare(key, data, options);

      return;
    }

    await this.uploadNode(key, data, options);

    //#endregion
  }
  //#endregion

  //#region methods / uplaod cloudflare
  async uploadCloudflare(
    key: string,
    data: TaonStorageUploadData,
    options: TaonStorageUploadOptions,
  ): Promise<void> {
    //#region @backendFunc
    const storageKey = this.getFileRelativePathInBucket(key);

    const body = data instanceof Blob ? data.stream() : data;

    await this.cloudflareBucket.put(storageKey, body as any, {
      httpMetadata: {
        contentType:
          options.contentType || (data instanceof Blob ? data.type : undefined),
      },
      customMetadata: {
        ...(options.metadata || {}),
        ...(options.fileName
          ? {
              fileName: options.fileName,
            }
          : {}),
      },
    });
    //#endregion
  }
  //#endregion

  //#region methods / upload node

  async uploadNode(
    key: string,
    data: TaonStorageUploadData,
    options: TaonStorageUploadOptions = {},
  ): Promise<void> {
    //#region @backendFunc
    //#region @esmRemove
    const absPath = this.getFileAbsPathInBucket(key);

    await fse.promises.mkdir(path.dirname(absPath), {
      recursive: true,
    });

    // Node.js Readable
    if (data instanceof Readable) {
      await pipeline(data, fse.createWriteStream(absPath));
    } else if (data instanceof ReadableStream) {
      await pipeline(
        Readable.fromWeb(data as any),
        fse.createWriteStream(absPath),
      );
    } else if (data instanceof Blob) {
      await fse.promises.writeFile(
        absPath,
        Buffer.from(await data.arrayBuffer()),
      );
    } else if (data instanceof ArrayBuffer) {
      await fse.promises.writeFile(absPath, Buffer.from(data));
    } else {
      await fse.promises.writeFile(
        absPath,
        typeof data === 'string' ? data : Buffer.from(data),
      );
    }
    await this.writeNodeMetadata(absPath, {
      fileName: options.fileName,
      contentType: options.contentType,
      metadata: options.metadata,
    });
    //#endregion
    //#endregion
  }

  //#endregion

  //#region methods / storage exists

  async storageExists(key: string): Promise<boolean> {
    //#region @backendFunc
    key = this.normalizeKey(key);

    if (UtilsOs.isRunningInCloudflareWorker()) {
      const object = await this.cloudflareBucket.head(
        this.getFileRelativePathInBucket(key),
      );

      return !!object;
    }

    try {
      const stat = await fse.promises.stat(this.getFileAbsPathInBucket(key));

      return stat.isFile();
    } catch {
      return false;
    }
    //#endregion
  }
  //#endregion

  //#region methods / download storage
  async storageOpenDownload(
    key: string,
    range?: { start: number; end: number },
  ): Promise<
    | {
        body: ReadableStream<Uint8Array>;
        size: number;
        contentLength: number;
        contentType?: string;
        fileName?: string;
      }
    | undefined
  > {
    //#region @backendFunc
    key = this.normalizeKey(key);
    if (UtilsOs.isRunningInCloudflareWorker()) {
      const storageKey = this.getFileRelativePathInBucket(key);
      const object = await this.cloudflareBucket.get(
        storageKey,
        range
          ? {
              range: {
                offset: range.start,
                length: range.end - range.start + 1,
              },
            }
          : undefined,
      );
      if (!object) {
        return undefined;
      }
      const reader = object.body.getReader();
      const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        },
        cancel(reason) {
          return reader.cancel(reason);
        },
      });
      return {
        body,
        size: object.size,
        contentLength: range ? range.end - range.start + 1 : object.size,
        contentType:
          object.httpMetadata?.contentType || this.inferContentType(key),
        fileName: this.safeFileName(
          object.customMetadata?.['fileName'] || this.fileNameForKey(key),
        ),
      };
    }

    //#region @esmRemove
    const absPath = this.getFileAbsPathInBucket(key);
    let stat;
    try {
      stat = await fse.promises.stat(absPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
    if (!stat.isFile()) {
      return undefined;
    }
    const metadata = await this.readNodeMetadata(absPath);
    const start = range?.start ?? 0;
    const end = range?.end ?? Math.max(0, stat.size - 1);
    const nodeStream = fse.createReadStream(
      absPath,
      range ? { start, end } : undefined,
    );
    const body = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    return {
      body,
      size: stat.size,
      contentLength: range ? end - start + 1 : stat.size,
      contentType: metadata.contentType || this.inferContentType(key),
      fileName: this.safeFileName(
        metadata.fileName || this.fileNameForKey(key),
      ),
    };
    //#endregion
    //#endregion
  }
  //#endregion

  //#region methods / node metadata
  private nodeMetadataPath(absPath: string): string {
    return `${absPath}.taon-meta.json`;
  }

  private fileNameForKey(key: string): string {
    return path.basename(key).replace(/^[0-9a-f-]{36}__/i, '');
  }

  private safeFileName(fileName: string): string {
    return (
      fileName
        .replace(/\\/g, '/')
        .split('/')
        .pop()
        ?.replace(/^[0-9a-f-]{36}__/i, '') || 'download'
    );
  }

  private inferContentType(key: string): string | undefined {
    const types: Record<string, string> = {
      '.aac': 'audio/aac',
      '.flac': 'audio/flac',
      '.m4a': 'audio/mp4',
      '.mid': 'audio/midi',
      '.midi': 'audio/midi',
      '.mkv': 'video/x-matroska',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.mpeg': 'video/mpeg',
      '.mpg': 'video/mpeg',
      '.oga': 'audio/ogg',
      '.ogg': 'audio/ogg',
      '.ogv': 'video/ogg',
      '.opus': 'audio/opus',
      '.wav': 'audio/wav',
      '.weba': 'audio/webm',
      '.webm': 'video/webm',
      '.wma': 'audio/x-ms-wma',
    };
    return types[path.extname(key).toLowerCase()];
  }

  private async readNodeMetadata(absPath: string): Promise<{
    contentType?: string;
    fileName?: string;
    metadata?: Record<string, string>;
  }> {
    try {
      return JSON.parse(
        await fse.promises.readFile(this.nodeMetadataPath(absPath), 'utf8'),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  private async writeNodeMetadata(
    absPath: string,
    metadata: {
      contentType?: string;
      fileName?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<void> {
    await fse.promises.writeFile(
      this.nodeMetadataPath(absPath),
      JSON.stringify(metadata),
      'utf8',
    );
  }
  //#endregion

  //#region methods / storage delete
  async storageDelete(key: string): Promise<boolean> {
    //#region @backendFunc
    key = this.normalizeKey(key);

    if (!(await this.storageExists(key))) {
      return false;
    }

    if (UtilsOs.isRunningInCloudflareWorker()) {
      await this.cloudflareBucket.delete(this.getFileRelativePathInBucket(key));

      return true;
    }

    await fse.promises.unlink(this.getFileAbsPathInBucket(key));
    await fse.remove(`${this.getFileAbsPathInBucket(key)}.taon-meta.json`);

    return true;
    //#endregion
  }
  //#endregion

  //#region mehods / store
  async storageUploadFromTempFile(
    key: string,
    file: TaonUploadedFile,
    options?: {
      fileName?: string;
      contentType?: string;
    },
  ): Promise<void> {
    //#region @backendFunc

    if (UtilsOs.isRunningInCloudflareWorker()) {
      await this.storageUploadFromCloudflareTempFile(key, file, options);

      return;
    }

    await this.storageUploadFromNodeTempFile(key, file, options);

    //#endregion
  }
  //#endregion

   //#region mehods / storage upload from node temp file
  private async storageUploadFromNodeTempFile(
    key: string,
    file: TaonUploadedFile,
    options?: {
      fileName?: string;
      contentType?: string;
    },
  ): Promise<void> {
    //#region @backendFunc

    const stream = fse.createReadStream(file.tempKeyOrPath);

    try {
      await this.storageUpload(key, stream as any, options);
    } finally {
      await fse.remove(file.tempKeyOrPath);
    }

    //#endregion
  }
  //#endregion

   //#region mehods / storage uplaod from cloudflare temp file
  private async storageUploadFromCloudflareTempFile(
    key: string,
    file: TaonUploadedFile,
    options?: {
      fileName?: string;
      contentType?: string;
    },
  ): Promise<void> {
    //#region @backendFunc

    const tempStorage = GlobalStorage.get('TAON_TEMP_STORAGE') as R2Bucket;

    const object = await tempStorage.get(file.tempKeyOrPath);

    if (!object) {
      throw new Error(
        `Temporary uploaded file does not exist: ${file.tempKeyOrPath}`,
      );
    }

    try {
      await this.storageUpload(key, object.body as any, options);
    } finally {
      await tempStorage.delete(file.tempKeyOrPath);
    }

    //#endregion
  }
  //#endregion

  //#region methods / storage metadata
  async storageGetMetadata(
    key: string,
  ): Promise<TaonStorageObject | undefined> {
    //#region @backendFunc
    key = this.normalizeKey(key);

    if (UtilsOs.isRunningInCloudflareWorker()) {
      const storageKey = this.getFileRelativePathInBucket(key);

      const object = await this.cloudflareBucket.head(storageKey);

      if (!object) {
        return undefined;
      }

      return {
        key,
        storageKey,
        fileName: this.safeFileName(
          object.customMetadata?.['fileName'] || this.fileNameForKey(key),
        ),
        contentType:
          object.httpMetadata?.contentType || this.inferContentType(key),
        size: object.size,
        lastModified: object.uploaded,
        etag: object.httpEtag,
        metadata: object.customMetadata,
      };
    }

    const absPath = this.getFileAbsPathInBucket(key);

    try {
      const stat = await fse.promises.stat(absPath);
      if (!stat.isFile()) {
        return undefined;
      }
      const metadata = await this.readNodeMetadata(absPath);

      return {
        key,
        storageKey: this.getFileRelativePathInBucket(key),
        fileName: this.safeFileName(
          metadata.fileName || this.fileNameForKey(key),
        ),
        contentType: metadata.contentType || this.inferContentType(key),
        metadata: metadata.metadata,
        size: stat.size,
        lastModified: stat.mtime,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
    //#endregion
  }
  //#endregion

  //#region methods / storage copy
  async storageCopy(
    sourceKey: string,
    destinationKey: string,
    options: TaonStorageCopyOptions = {},
  ): Promise<TaonStorageObject> {
    //#region @backendFunc

    sourceKey = this.normalizeKey(sourceKey);
    destinationKey = this.normalizeKey(destinationKey);

    if (sourceKey === destinationKey) {
      Taon.error({
        message: `Source and destination are the same: ${sourceKey}`,
        status: 400,
      });
    }

    const sourceExists = await this.storageExists(sourceKey);

    if (!sourceExists) {
      Taon.error({
        message: `Storage object not found: ${sourceKey}`,
        status: 404,
      });
    }

    if (!options.overwrite && (await this.storageExists(destinationKey))) {
      Taon.error({
        message: `Storage object already exists: ${destinationKey}`,
        status: 409,
      });
    }

    if (UtilsOs.isRunningInCloudflareWorker()) {
      const sourceStorageKey = this.getFileRelativePathInBucket(sourceKey);

      const destinationStorageKey =
        this.getFileRelativePathInBucket(destinationKey);

      const sourceObject = await this.cloudflareBucket.get(sourceStorageKey);

      if (!sourceObject) {
        Taon.error({
          message: `Storage object not found: ${sourceKey}`,
          status: 404,
        });
      }

      await this.cloudflareBucket.put(
        destinationStorageKey,
        sourceObject.body,
        {
          httpMetadata: sourceObject.httpMetadata,
          customMetadata: sourceObject.customMetadata,
        },
      );
    } else {
      const sourceAbsPath = this.getFileAbsPathInBucket(sourceKey);

      const destinationAbsPath = this.getFileAbsPathInBucket(destinationKey);

      await fse.promises.mkdir(path.dirname(destinationAbsPath), {
        recursive: true,
      });

      await fse.promises.copyFile(sourceAbsPath, destinationAbsPath);
      const sourceMetadata = await this.readNodeMetadata(sourceAbsPath);
      if (Object.keys(sourceMetadata).length) {
        await this.writeNodeMetadata(destinationAbsPath, sourceMetadata);
      } else {
        await fse.remove(`${destinationAbsPath}.taon-meta.json`);
      }
    }

    return (await this.storageGetMetadata(destinationKey))!;
    //#endregion
  }
  //#endregion

  //#region methods / storage copy
  async storageMove(
    sourceKey: string,
    destinationKey: string,
    options: TaonStorageMoveOptions = {},
  ): Promise<TaonStorageObject> {
    //#region @backendFunc

    sourceKey = this.normalizeKey(sourceKey);
    destinationKey = this.normalizeKey(destinationKey);

    if (sourceKey === destinationKey) {
      const existing = await this.storageGetMetadata(sourceKey);

      if (!existing) {
        Taon.error({
          message: `Storage object not found: ${sourceKey}`,
          status: 404,
        });
      }

      return existing!;
    }

    if (!(await this.storageExists(sourceKey))) {
      Taon.error({
        message: `Storage object not found: ${sourceKey}`,
        status: 404,
      });
    }

    if (!options.overwrite && (await this.storageExists(destinationKey))) {
      Taon.error({
        message: `Storage object already exists: ${destinationKey}`,
        status: 409,
      });
    }

    if (UtilsOs.isRunningInCloudflareWorker()) {
      /**
       * R2 has object storage semantics.
       *
       * Move = copy + delete.
       */
      await this.storageCopy(sourceKey, destinationKey, {
        overwrite: options.overwrite,
      });

      await this.storageDelete(sourceKey);
    } else {
      const sourceAbsPath = this.getFileAbsPathInBucket(sourceKey);

      const destinationAbsPath = this.getFileAbsPathInBucket(destinationKey);

      await fse.promises.mkdir(path.dirname(destinationAbsPath), {
        recursive: true,
      });

      if (options.overwrite && (await this.storageExists(destinationKey))) {
        await fse.promises.unlink(destinationAbsPath);
      }
      await fse.remove(`${destinationAbsPath}.taon-meta.json`);

      /**
       * rename() is ideal here:
       *
       * - does not copy file contents
       * - extremely fast on same filesystem
       * - works perfectly for your controller folder storage
       */
      try {
        await fse.promises.rename(sourceAbsPath, destinationAbsPath);
        const sourceMetadataPath = `${sourceAbsPath}.taon-meta.json`;
        if (await fse.pathExists(sourceMetadataPath)) {
          await fse.promises.rename(
            sourceMetadataPath,
            `${destinationAbsPath}.taon-meta.json`,
          );
        }
      } catch (error: any) {
        /**
         * EXDEV means source/destination crossed filesystem
         * boundaries.
         *
         * Unlikely here, but this makes the primitive robust.
         */
        if (error?.code !== 'EXDEV') {
          throw error;
        }

        await fse.promises.copyFile(sourceAbsPath, destinationAbsPath);
        const sourceMetadata = await this.readNodeMetadata(sourceAbsPath);
        if (Object.keys(sourceMetadata).length) {
          await this.writeNodeMetadata(destinationAbsPath, sourceMetadata);
        }
        await fse.promises.unlink(sourceAbsPath);
        await fse.remove(`${sourceAbsPath}.taon-meta.json`);
      }
    }

    return (await this.storageGetMetadata(destinationKey))!;
    //#endregion
  }
  //#endregion

  //#region methods / storage list
  async storageList(
    options: TaonStorageListOptions = {},
  ): Promise<TaonStorageObject[]> {
    if (UtilsOs.isRunningInCloudflareWorker()) {
      return this.listCloudflare(options);
    }

    return this.listNode(options);
  }
  //#endregion

  //#region methods / list cloud flare
  private async listCloudflare(
    options: TaonStorageListOptions,
  ): Promise<TaonStorageObject[]> {
    //#region @backendFunc
    const controllerPrefix = this.getFileRelativePathInBucket(
      options.prefix || '',
    );

    const result = await this.cloudflareBucket.list({
      prefix: controllerPrefix,
      limit: options.limit,
      include: ['httpMetadata', 'customMetadata'],
    });

    const controllerRoot = this.getFileRelativePathInBucket('');

    return result.objects.map(object => {
      let key = object.key;

      if (key.startsWith(controllerRoot)) {
        key = key.substring(controllerRoot.length);
      }

      key = key.replace(/^\/+/, '');

      return {
        key,
        storageKey: object.key,

        fileName: this.safeFileName(
          object.customMetadata?.['fileName'] || this.fileNameForKey(key),
        ),

        contentType:
          object.httpMetadata?.contentType || this.inferContentType(key),

        size: object.size,
        lastModified: object.uploaded,
        etag: object.httpEtag,
        metadata: object.customMetadata,
      };
    });
    //#endregion
  }
  //#endregion

  //#region methods / list node
  private async listNode(
    options: TaonStorageListOptions,
  ): Promise<TaonStorageObject[]> {
    //#region @backendFunc
    const prefix = this.normalizeKey(options.prefix || '');

    const controllerRoot = this.getFileAbsPathInBucket('');

    const result: TaonStorageObject[] = [];

    const walk = async (directory: string): Promise<void> => {
      let entries: Dirent[];

      try {
        entries = await fse.promises.readdir(directory, {
          withFileTypes: true,
        });
      } catch {
        return;
      }

      for (const entry of entries) {
        const absPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await walk(absPath);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        if (entry.name.endsWith('.taon-meta.json')) {
          continue;
        }

        const key = this.normalizeKey(path.relative(controllerRoot, absPath));

        if (prefix && !key.startsWith(prefix)) {
          continue;
        }

        const metadata = await this.storageGetMetadata(key);
        if (metadata) {
          result.push(metadata);
        }

        if (options.limit && result.length >= options.limit) {
          return;
        }
      }
    };

    await walk(controllerRoot);

    return result;
    //#endregion
  }
  //#endregion
}
