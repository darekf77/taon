//#region imports
import { Readable } from 'node:stream'; // @esmRemove @backend

import { R2Bucket } from '@cloudflare/workers-types';
import { Translation } from '@taon-dev/i18n/src';
import type { Dirent } from 'fs-extra';
import { FetchResponseType, Ng2RestFetchRequestConfig } from 'ng2-rest/src';
import { fse, path } from 'tnp-core/src';
import { crossPlatformPath, UtilsOs } from 'tnp-core/src';

import { Replecables } from '../constants';
import { TaonController } from '../decorators/classes/controller-decorator';
import { DELETE, GET, POST } from '../decorators/http/http-methods-decorators';
import { Body, Query } from '../decorators/http/http-params-decorators';
import { ExpressRequest, ExpressResponse } from '../express-types';
import { ClassHelpers } from '../helpers/class-helpers';
import { TaonUploadedFile } from '../helpers/express-request-to-form-data';
import { uploadFileInChunks } from '../helpers/upload-file-in-chunks';
import { getStatusCode, HttpStatusEnum } from '../http-status';
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
  TaonMultipartUploadOptions,
  TaonMultipartUploadSession,
  TaonMultipartUploadPart,
  TaonChunkedUploadOptions,
} from './base-storage-models';
//#endregion

const t = Translation.for(
  Replecables.__FILE_RELATIVE_PATH__,
  Replecables.__LANG_IMPORT_MAP__,
);

@TaonController<TaonBaseStorageController>({
  className: 'TaonBaseStorageController',
})
export abstract class TaonBaseStorageController<
  UPLOAD_FILE_QUERY_PARAMS = {},
  CONTOROLLER = any,
> extends TaonBaseController<UPLOAD_FILE_QUERY_PARAMS, CONTOROLLER> {
  // taonStorageRepository = this.injectCustomRepo(TaonBaseStorageRepository);

  public readonly storage = new TaonBaseStorageBackend(this);

  //#region methods / storage object exists
  protected storageObjectExists(key: string): Promise<boolean> {
    return this.storage.storageExists(key);
  }
  //#endregion

  //#region API / multipart uploads
  @POST()
  public startMultipartUpload(
    @Body('options') options: TaonMultipartUploadOptions,
    @Query('queryParams') queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): Models.Http.Response<TaonMultipartUploadSession> {
    //#region @backendFunc
    return async (req, res) => {
      const owner = this.multipartOwner(req);
      if (
        !options ||
        typeof options.fileName !== 'string' ||
        !options.fileName ||
        options.fileName.length > 180
      ) {
        Taon.error({
          message: 'An upload filename of at most 180 characters is required.',
          status: 400,
        });
      }
      const key = `${crypto.randomUUID()}__${options.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      await this.requireMultipartPermission(
        'start',
        key,
        options,
        queryParams,
        req,
        res,
      );
      return this.storage.multipart.start(
        key,
        owner,
        options,
        queryParams,
        this.multipartMaxRequestBytes,
      );
    };
    //#endregion
  }

  //#region API / upload multipart part
  @POST({
    overrideContentType: 'application/octet-stream',
  })
  public uploadMultipartPart(
    @Body() chunk: Blob,
    @Query('uploadId') uploadId: string,
    @Query('partNumber') partNumber: number | string,
    @Query('sha256') sha256: string,
  ): Models.Http.Response<TaonMultipartUploadPart> {
    //#region @backendFunc
    return async (req, res) => {
      const owner = this.multipartOwner(req);
      const session =
        await this.storage.multipart.inspect<UPLOAD_FILE_QUERY_PARAMS>(
          uploadId,
          owner,
        );
      await this.requireMultipartPermission(
        'part',
        session.key,
        session.options,
        session.queryParams,
        req,
        res,
      );
      const contentType = (req.headers['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (contentType !== 'application/octet-stream') {
        Taon.error({
          message: `Multipart chunks require application/octet-stream, got "${contentType}"`,
          status: 415,
        });
      }
      const length = req.headers['content-length'];
      if (
        length &&
        (!/^\d+$/.test(length) ||
          Number(length) >= this.multipartMaxRequestBytes)
      ) {
        Taon.error({
          message: 'Chunk exceeds the configured request-body limit.',
          status: 413,
        });
      }
      if (session.options.chunkSize >= this.multipartMaxRequestBytes) {
        Taon.error({
          message: 'Session chunk size exceeds the current request-body limit.',
          status: 413,
        });
      }
      let body: ReadableStream<Uint8Array>;
      if (UtilsOs.isRunningInCloudflareWorker()) {
        body = req.raw?.body;
      } else {
        //#region @esmRemove
        body = Readable.toWeb(req) as ReadableStream<Uint8Array>;
        //#endregion
      }
      if (!body) {
        Taon.error({
          message: 'Binary upload request stream is missing.',
          status: 400,
        });
      }
      if (typeof partNumber === 'string' && !/^[1-9]\d*$/.test(partNumber)) {
        Taon.error({ message: 'Invalid multipart part number.', status: 400 });
      }
      return this.storage.multipart.uploadPart(
        uploadId,
        owner,
        Number(partNumber),
        sha256,
        body,
      );
    };
    //#endregion
  }
  //#endregion

  //#region API / complete multipart upload
  @POST()
  public completeMultipartUpload(
    @Query('uploadId') uploadId: string,
  ): Models.Http.Response<TaonStorageObject[]> {
    //#region @backendFunc
    return async (req, res) => {
      const owner = this.multipartOwner(req);
      const session =
        await this.storage.multipart.inspect<UPLOAD_FILE_QUERY_PARAMS>(
          uploadId,
          owner,
        );
      await this.requireMultipartPermission(
        'complete',
        session.key,
        session.options,
        session.queryParams,
        req,
        res,
      );
      return this.storage.multipart.complete<UPLOAD_FILE_QUERY_PARAMS>(
        uploadId,
        owner,
        async (object, queryParams) => {
          await this.afterFileUploadHook(object, queryParams);
          return this.handleCompletedMultipartUpload(
            object,
            queryParams,
            req,
            res,
          );
        },
      );
    };
    //#endregion
  }
  //#endregion

  //#region API / abort multipart upload
  @POST()
  public abortMultipartUpload(
    @Query('uploadId') uploadId: string,
  ): Models.Http.Response<boolean> {
    //#region @backendFunc
    return async (req, res) => {
      const owner = this.multipartOwner(req);
      const session =
        await this.storage.multipart.inspect<UPLOAD_FILE_QUERY_PARAMS>(
          uploadId,
          owner,
        );
      await this.requireMultipartPermission(
        'abort',
        session.key,
        session.options,
        session.queryParams,
        req,
        res,
      );
      return this.storage.multipart.abort(uploadId, owner);
    };
    //#endregion
  }
  //#endregion

  /**
   * Set to the deployed platform's body limit in bytes (default: 100 MB).
   * Chunk sizes must be strictly smaller. R2 non-final parts require >=5 MiB.
   */
  protected get multipartMaxRequestBytes(): number {
    //#region @backendFunc
    return 100_000_000;
    //#endregion
  }

  //#region methods / multipart owner
  private multipartOwner(req: ExpressRequest): string {
    //#region @backendFunc
    if (
      (typeof req.userId !== 'string' && typeof req.userId !== 'number') ||
      !String(req.userId).trim() ||
      String(req.userId) === '0' ||
      (typeof req.userId === 'number' &&
        (!Number.isSafeInteger(req.userId) || req.userId < 0))
    ) {
      Taon.error({
        message: 'Authentication is required for multipart uploads.',
        status: 401,
      });
    }
    return String(req.userId);
    //#endregion
  }
  //#endregion

  //#region methods / require multipart permission
  private async requireMultipartPermission(
    operation: 'start' | 'part' | 'complete' | 'abort',
    key: string,
    options: TaonMultipartUploadOptions,
    queryParams: UPLOAD_FILE_QUERY_PARAMS,
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<void> {
    //#region @backendFunc
    if (
      !(await this.authorizeMultipartUpload({
        operation,
        key,
        options,
        queryParams,
        req,
        res,
      }))
    ) {
      Taon.error({
        message:
          'Multipart upload is not permitted by this storage controller.',
        status: 403,
      });
    }
    //#endregion
  }
  //#endregion

  /**
   * Opt in explicitly, using the same application permission checks as normal
   * uploads. Keys are generated by the server, never supplied by the client.
   */
  //#region methods / authorize multipart upload
  protected async authorizeMultipartUpload(options: {
    operation: 'start' | 'part' | 'complete' | 'abort';
    key: string;
    options: TaonMultipartUploadOptions;
    queryParams?: UPLOAD_FILE_QUERY_PARAMS;
    req: ExpressRequest;
    res: ExpressResponse;
  }): Promise<boolean> {
    //#region @backendFunc
    return false;
    //#endregion
  }
  //#endregion

  //#region methods / handle completed multipart upload
  protected async handleCompletedMultipartUpload(
    object: TaonStorageObject,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
    req?: ExpressRequest,
    res?: ExpressResponse,
  ): Promise<TaonStorageObject[]> {
    //#region @backendFunc
    return [object];
    //#endregion
  }
  //#endregion

  //#region API / cleanup abandoned uploads
  public async cleanupAbandonedUploads(): Promise<number> {
    //#region @backendFunc
    return this.storage.multipart.cleanupAbandonedUploads();
    //#endregion
  }
  //#endregion
  //#endregion

  //#region API / upload file in chunks
  /**
   * Call from an Angular API service with this injected storage controller.
   * Small-file uploadFormDataToServer remains unchanged and is not auto-routed.
   *
   * await controller.uploadFileInChunks(file, {
   *   chunkSize: 20 * 1024 * 1024,
   *   concurrency: 3,
   *   signal: cancellation.signal,
   *   onProgress: percentage => progress.set(percentage),
   * }, queryParams, { reauthenticateOn401 });
   *
   * Override authorizeMultipartUpload to opt in and reuse application upload
   * permissions on every operation. Override handleCompletedMultipartUpload
   * for response enrichment (e.g. private download URLs); do not call the hook
   * there because completion already invokes it once. Query params must be
   * JSON-serializable. Call cleanupAbandonedUploads from a scheduled backend job.
   * Failed/uncertain external hook side effects are not replayed automatically.
   */

  public async uploadFileInChunks(
    file: File,
    options: TaonChunkedUploadOptions = {},
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
    requestConfig: Ng2RestFetchRequestConfig = {},
  ): Promise<TaonStorageObject[]> {
    const { signal, body: _body, ...config } = requestConfig;
    const jsonHeaders = new Headers(config.headers);
    jsonHeaders.set('Content-Type', 'application/json');
    const jsonConfig = { ...config, headers: jsonHeaders };
    return uploadFileInChunks(
      file,
      {
        start: async chunkSize =>
          (
            await this.startMultipartUpload(
              {
                fileName: options.fileName || file.name,
                contentType: options.contentType || file.type,
                metadata: options.metadata,
                size: file.size,
                chunkSize,
              },
              queryParams,
            ).request(jsonConfig)
          ).body.json,
        part: async (uploadId, partNumber, sha256, chunk, signal) =>
          (
            await this.uploadMultipartPart(
              chunk,
              uploadId,
              partNumber,
              sha256,
            ).request({ ...config, body: chunk, signal })
          ).body.json,
        complete: async uploadId =>
          (await this.completeMultipartUpload(uploadId).request(jsonConfig))
            .body.json,
        abort: async uploadId =>
          (await this.abortMultipartUpload(uploadId).request(jsonConfig)).body
            .json,
      },
      { ...options, signal: options.signal ?? signal },
    );
  }
  //#endregion

  //#region API / download
  /**
   * This method is only for nodejs???
   */
  //#region API / download
  @GET({
    //#region @backend
    overrideResponseType: FetchResponseType.Stream,
    //#endregion
  })
  public download(
    @Query('key') key: string,
    @Query('token') token?: string,
    @Query('download') download = false,
  ): Models.Http.Response<ReadableStream<Uint8Array>> {
    //#region @backendFunc
    return async (req, res) => {
      if (!key) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Invalid or not provided "key" parameter'),
        });
      }

      key = this.storage.normalizeKey(key);

      if (token) {
        if (!(await this.verifyStorageDownloadToken({ key, token }))) {
          Taon.error({
            status: getStatusCode(HttpStatusEnum.FORBIDDEN),
            message: t.gettext('Invalid or expired storage download token.'),
          });
        }
      } else if (!(await this.isPublicStorageKey(key))) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('A valid storage download token is required.'),
        });
      }

      const storedMetadata = await this.storage.storageGetMetadata(key);
      if (!storedMetadata) {
        Taon.error({
          message: `Storage object not found: ${key}`,
          status: 404,
        });
      }
      const rangeHeader = req.headers.range;
      const range = rangeHeader
        ? parseStorageRange(rangeHeader, storedMetadata!.size)
        : undefined;
      if (rangeHeader && !range) {
        res.status(416);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Range', `bytes */${storedMetadata!.size}`);
        return new ReadableStream<Uint8Array>({
          start(controller) {
            controller.close();
          },
        });
      }
      const metadata = await this.storage.storageOpenDownload(key, range);
      if (!metadata) {
        Taon.error({
          message: `Storage object not found: ${key}`,
          status: 404,
        });
      }

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', String(metadata.contentLength));
      res.setHeader(
        'Content-Type',
        metadata.contentType || 'application/octet-stream',
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Cache-Control',
        token ? 'private, no-store' : 'public, max-age=300',
      );
      if (download) {
        const fileName = (metadata.fileName || 'download').replace(
          /[\r\n"]/g,
          '_',
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${fileName}"`,
        );
      }

      if (rangeHeader) {
        res.status(206);
        res.setHeader(
          'Content-Range',
          `bytes ${range!.start}-${range!.end}/${metadata.size}`,
        );
      }
      return metadata.body;
    };
    //#endregion
  }
  //#endregion
  //#endregion

  //#region API / delete

  @DELETE()
  public delete(@Query('key') key: string): Models.Http.Response<boolean> {
    //#region @backendFunc
    return async (req, res) => {
      if (!key) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Invalid or not provided "key" parameter'),
        });
      }

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
      if (!key) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Invalid or not provided "key" parameter'),
        });
      }

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
      if (!key) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Invalid or not provided "key" parameter'),
        });
      }

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

  //#region methods / handle upload files
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
        fileName: file.originalFileName || file.fileName,
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
  //#endregion

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
      if (!key) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Invalid or not provided "key" parameter'),
        });
      }

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
      if (!key) {
        Taon.error({
          status: getStatusCode(HttpStatusEnum.FORBIDDEN),
          message: t.gettext('Invalid or not provided "key" parameter'),
        });
      }

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
   * Also called once when a multipart upload is successfully completed.
   */
  //#region methods / after file upload hook
  abstract afterFileUploadHook(
    fileObject?: TaonStorageObject,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): void | Promise<void>;
  //#endregion
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
  //#region methods / build storage download url
  abstract buildStorageDownloadUrl(options: {
    req: any;
    key: string;
    private: boolean;
    token?: string;
    download?: boolean;
  }): string;
  //#endregion
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
  //#region methods / create storage download token
  abstract createStorageDownloadToken(options: {
    key: string;
    expiresAt: number;
  }): Promise<string>;
  //#endregion

  /**
   * Validate a private download token for this controller and exact key.
   */
  //#region methods / verify storage download token
  protected async verifyStorageDownloadToken(options: {
    key: string;
    token: string;
  }): Promise<boolean> {
    return false;
  }
  //#endregion

  /**
   * Public storage access must be explicitly opted into by the controller.
   */
  //#region methods / is public storage key
  protected async isPublicStorageKey(key: string): Promise<boolean> {
    return false;
  }
  //#endregion
  //#endregion

  //#endregion
}

//#region parse storage range
function parseStorageRange(
  header: string,
  size: number,
): { start: number; end: number } | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || size <= 0) {
    return undefined;
  }
  const [, startText, endText] = match;
  let start: number;
  let end: number;
  if (!startText) {
    const suffixLength = Number(endText);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return undefined;
    }
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Number(endText) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return undefined;
  }
  return { start, end: Math.min(end, size - 1) };
}

//#endregion
