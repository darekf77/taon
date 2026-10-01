//#region imports
import { R2Bucket } from '@cloudflare/workers-types';
import type { Dirent } from 'fs-extra';
import { fse, path } from 'tnp-core/src';
import { crossPlatformPath, UtilsOs } from 'tnp-core/src';

import { TaonController } from '../decorators/classes/controller-decorator';
import { ClassHelpers } from '../helpers/class-helpers';
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
    return key.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');
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

    await this.uploadNode(key, data);

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
  async uploadNode(key: string, data: TaonStorageUploadData): Promise<void> {
    //#region @backendFunc
    const absPath = this.getFileAbsPathInBucket(key);

    await fse.promises.mkdir(path.dirname(absPath), {
      recursive: true,
    });

    if (data instanceof ReadableStream) {
      const reader = data.getReader();

      const file = fse.createWriteStream(absPath);

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          if (value) {
            if (!file.write(Buffer.from(value))) {
              await new Promise<void>(resolve => file.once('drain', resolve));
            }
          }
        }
      } finally {
        file.end();
      }

      return;
    }

    if (data instanceof Blob) {
      await fse.promises.writeFile(
        absPath,
        Buffer.from(await data.arrayBuffer()),
      );

      return;
    }

    if (data instanceof ArrayBuffer) {
      await fse.promises.writeFile(absPath, Buffer.from(data));

      return;
    }

    await fse.promises.writeFile(
      absPath,
      typeof data === 'string' ? data : Buffer.from(data),
    );
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

    return true;
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
        fileName: object.customMetadata?.['fileName'] || path.basename(key),
        contentType: object.httpMetadata?.contentType,
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

      return {
        key,
        storageKey: this.getFileRelativePathInBucket(key),
        fileName: path.basename(key),
        size: stat.size,
        lastModified: stat.mtime,
      };
    } catch {
      return undefined;
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

      /**
       * rename() is ideal here:
       *
       * - does not copy file contents
       * - extremely fast on same filesystem
       * - works perfectly for your controller folder storage
       */
      try {
        await fse.promises.rename(sourceAbsPath, destinationAbsPath);
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

        await fse.promises.unlink(sourceAbsPath);
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

        fileName: object.customMetadata?.['fileName'] || key.split('/').pop(),

        contentType: object.httpMetadata?.contentType,

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

        const key = this.normalizeKey(path.relative(controllerRoot, absPath));

        if (prefix && !key.startsWith(prefix)) {
          continue;
        }

        const stat = await fse.promises.stat(absPath);

        result.push({
          key,

          storageKey: this.getFileRelativePathInBucket(key),

          fileName: entry.name,
          size: stat.size,
          lastModified: stat.mtime,
        });

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
