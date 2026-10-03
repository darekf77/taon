//#region imports
import { R2Bucket } from '@cloudflare/workers-types';
import type { Dirent } from 'fs-extra';
import { FetchResponseType } from 'ng2-rest/src';
import { fse, path } from 'tnp-core/src';
import { crossPlatformPath, UtilsOs } from 'tnp-core/src';

import { TaonController } from '../decorators/classes/controller-decorator';
import { DELETE, GET, POST } from '../decorators/http/http-methods-decorators';
import { Body, Query } from '../decorators/http/http-params-decorators';
import { ExpressRequest, ExpressResponse } from '../express-types';
import { ClassHelpers } from '../helpers/class-helpers';
import { TaonUploadedFile } from '../helpers/express-request-to-form-data';
import { Taon } from '../index';
import { Models } from '../models';

import { TaonBaseController } from './base-controller';
import { TaonBaseStorageBackend } from './base-storage-backend';
import {
  TaonStorageCopyOptions,
  TaonStorageDeleteManyResult,
  TaonStorageListOptions,
  TaonStorageMoveOptions,
  TaonStorageObject,
  TaonStoragePrivateUrlOptions,
  TaonStorageUploadData,
  TaonStorageUploadOptions,
} from './base-storage-models';

//#endregion

@TaonController<TaonBaseStorageController>({
  className: 'TaonBaseStorageController',
})
export abstract class TaonBaseStorageController<
  UPLOAD_FILE_QUERY_PARAMS = {},
  CONTOROLLER = any,
> extends TaonBaseController<UPLOAD_FILE_QUERY_PARAMS, CONTOROLLER> {
  // taonStorageRepository = this.injectCustomRepo(TaonBaseStorageRepository);

  private readonly storage = new TaonBaseStorageBackend(this);

  //#region API / download
  /**
   * This method is only for nodejs???
   */
  @GET({
    //#region @backend
    overrideResponseType: FetchResponseType.Stream,
    //#endregion
  })
  public download(
    @Query('key') key: string,
  ): Models.Http.Response<ReadableStream<Uint8Array>> {
    //#region @backendFunc
    return async (reqr, res) => {
      key = this.storage.normalizeKey(key);

      if (UtilsOs.isRunningInCloudflareWorker()) {
        const storageKey = this.storage.getFileRelativePathInBucket(key);

        const object = await this.storage.cloudflareBucket.get(storageKey);

        if (!object) {
          throw new Error(`Storage object not found: ${key}`);
        }

        return object.body as any;
      }

      const absPath = this.storage.getFileAbsPathInBucket(key);

      if (!fse.existsSync(absPath)) {
        throw new Error(`Storage object not found: ${key}`);
      }

      const nodeStream = fse.createReadStream(absPath);

      return new ReadableStream<Uint8Array>({
        start(controller) {
          nodeStream.on('data', chunk => {
            controller.enqueue(
              typeof chunk === 'string'
                ? Buffer.from(chunk)
                : new Uint8Array(chunk),
            );
          });

          nodeStream.on('end', () => {
            controller.close();
          });

          nodeStream.on('error', error => {
            controller.error(error);
          });
        },

        cancel() {
          nodeStream.destroy();
        },
      });
    };
    //#endregion
  }
  //#endregion

  //#region API / delete

  @DELETE()
  public delete(@Query('key') key: string): Models.Http.Response<boolean> {
    //#region @backendFunc
    return async (req, res) => {
      return await this.storage.storageDelete(key);
    };
    //#endregion
  }

  //#endregion

  //#region API / exists

  @GET()
  public exists(@Query('key') key: string): Models.Http.Response<boolean> {
    //#region @backendFunc
    return async (req, res) => {
      return await this.storage.storageExists(key);
    };
    //#endregion
  }

  //#endregion

  //#region API / get metadata
  @GET()
  public getMetadata(
    @Query('key') key: string,
  ): Models.Http.Response<TaonStorageObject | undefined> {
    //#region @backendFunc
    return async (req, res) => {
      return await this.storage.storageGetMetadata(key);
    };
    //#endregion
  }
  //#endregion

  //#region API / list
  @GET()
  public list(
    @Query('options') options: TaonStorageListOptions,
  ): Models.Http.Response<TaonStorageObject[]> {
    //#region @backendFunc
    return async () => {
      return await this.storage.storageList(options || {});
    };
    //#endregion
  }
  //#endregion

  //#region API / upload form data to server
  @POST({
    overrideContentType: 'multipart/form-data',
  })
  public uploadFormDataToServer(
    @Body() formData: FormData,
    @Query() queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): Models.Http.Response<TaonStorageObject[]> {
    return async (req, res, { bodyFormDataFiles }) => {
      //#region @backendFunc
      return await this.handleUploadFiles(
        bodyFormDataFiles,
        queryParams,
        req,
        res,
      );
      //#endregion
    };
  }
  //#endregion

  protected async handleUploadFiles(
    bodyFormDataFiles: TaonUploadedFile[],
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
    req?: ExpressRequest<any>,
    res?: ExpressResponse<any>,
  ): Promise<TaonStorageObject[]> {
    //#region @backendFunc
    const result: TaonStorageObject[] = [];

    for (const file of bodyFormDataFiles) {
      const key = this.storage.normalizeKey(file.fileName);

      await this.storage.storageUploadFromTempFile(key, file, {
        fileName: file.fileName,
        contentType: file.mimeType,
      });

      const object = await this.storage.storageGetMetadata(key);

      if (object) {
        await this.afterFileUploadHook(object, queryParams);

        result.push(object);
      }
    }

    return result;
    //#endregion
  }

  //#region API / copy

  @POST()
  public copy(
    @Query('sourceKey') sourceKey: string,
    @Query('destinationKey') destinationKey: string,
    @Body('options') options: TaonStorageCopyOptions,
  ): Models.Http.Response<TaonStorageObject> {
    //#region @backendFunc
    return async (req, res) => {
      return await this.storage.storageCopy(
        sourceKey,
        destinationKey,
        options || {},
      );
    };
    //#endregion
  }

  //#endregion

  //#region API / move

  @POST()
  public move(
    @Query('sourceKey') sourceKey: string,
    @Query('destinationKey') destinationKey: string,
    @Body('options') options: TaonStorageMoveOptions,
  ): Models.Http.Response<TaonStorageObject> {
    //#region @backendFunc
    return async (req, res) => {
      return await this.storage.storageMove(
        sourceKey,
        destinationKey,
        options || {},
      );
    };
    //#endregion
  }

  //#endregion

  //#region API / delete many

  @DELETE()
  public deleteMany(
    @Query('keys') keys: string[],
  ): Models.Http.Response<TaonStorageDeleteManyResult> {
    //#region @backendFunc
    return async (req, res) => {
      const result: TaonStorageDeleteManyResult = {
        deleted: [],
        notFound: [],
      };

      const normalizedKeys = keys.map(key => this.storage.normalizeKey(key));

      if (UtilsOs.isRunningInCloudflareWorker()) {
        /**
         * Determine existence first because R2 delete itself
         * doesn't distinguish missing objects in the result.
         */
        const existence = await Promise.all(
          normalizedKeys.map(async key => ({
            key,
            exists: await this.storage.storageExists(key),
          })),
        );

        const existingKeys = existence
          .filter(item => item.exists)
          .map(item => item.key);

        result.notFound.push(
          ...existence.filter(item => !item.exists).map(item => item.key),
        );

        if (existingKeys.length > 0) {
          await this.storage.cloudflareBucket.delete(
            existingKeys.map(key =>
              this.storage.getFileRelativePathInBucket(key),
            ),
          );

          result.deleted.push(...existingKeys);
        }

        return result;
      }

      for (const key of normalizedKeys) {
        if (await this.storage.storageDelete(key)) {
          result.deleted.push(key);
        } else {
          result.notFound.push(key);
        }
      }

      return result;
    };
    //#endregion
  }

  //#endregion

  //#region API / get public url
  @GET()
  public getPublicUrl(@Query('key') key: string): Models.Http.Response<string> {
    //#region @backendFunc
    return async (req, res) => {
      key = this.storage.normalizeKey(key);

      if (!(await this.storage.storageExists(key))) {
        Taon.error({
          message: `Storage object not found: ${key}`,
          status: 404,
        });
      }

      return this.buildStorageDownloadUrl({
        req,
        key,
        private: false,
      });
    };
    //#endregion
  }
  //#endregion

  //#region API / get private url
  @GET()
  public getPrivateUrl(
    @Query('key') key: string,
    @Body('options') options: TaonStoragePrivateUrlOptions = {},
  ): Models.Http.Response<string> {
    //#region @backendFunc
    return async (req, res) => {
      key = this.storage.normalizeKey(key);

      if (!(await this.storage.storageExists(key))) {
        Taon.error({
          message: `Storage object not found: ${key}`,
          status: 404,
        });
      }

      const expiresInSeconds = options.expiresInSeconds ?? 60 * 60;

      const expiresAt = Date.now() + expiresInSeconds * 1000;

      const token = await this.createStorageDownloadToken({
        key,
        expiresAt,
      });

      return this.buildStorageDownloadUrl({
        req,
        key,
        private: true,
        token,
      });
    };
    //#endregion
  }
  //#endregion

  //#region abstract

  //#region abstract / after file upload action hook
  /**
   * Hook after a file is uploaded through
   * `uploadFormDataToServer()` or `uploadLocalFileToServer()`.
   */
  abstract afterFileUploadHook(
    fileObject?: TaonStorageObject,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): void | Promise<void>;
  //#endregion

  //#region abstract / build storage download url
  /**
   * build URL from your Taon controller route system

    Something like:

    https://myapp.com/api/CourseVideoController/downloadFile
      ?key=courses/123/lesson.mp4
      &token=...

    I would use YOUR Taon route/url generator here,
    rather than manually constructing controller URLs.
   */
  abstract buildStorageDownloadUrl(options: {
    req: any;
    key: string;
    private: boolean;
    token?: string;
  }): string;
  //#endregion

  //#region abstract / create storage download token
  /**
   *
    use your existing Taon JWT/signing utilities.

    payload:

    {
      storageController: ClassHelpers.getName(this),
      key,
      expiresAt
    }
   */
  abstract createStorageDownloadToken(options: {
    key: string;
    expiresAt: number;
  }): Promise<string>;
  //#endregion

  //#endregion
}
