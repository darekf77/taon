import { R2Bucket } from '@cloudflare/workers-types';
import {
  RestErrorResponseWrapper,
  RestResponseWrapper,
  HttpResponseError,
  Ng2RestAxiosRequestConfig,
} from 'ng2-rest/src';
import {
  CoreModels,
  crossPlatformPath,
  fse,
  Helpers,
  path,
  UtilsOs,
  UtilsTerminal,
} from 'tnp-core/src';

import { TaonController } from '../decorators/classes/controller-decorator';
import { POST } from '../decorators/http/http-methods-decorators';
import { Body, Path, Query } from '../decorators/http/http-params-decorators';
import type { EndpointContext } from '../endpoint-context';
import type { ContextsEndpointStorage } from '../endpoint-context-storage';
import type { Models } from '../models';

import { TaonBaseFileUploadMiddleware } from './base-file-upload.middleware';
import { TaonBaseInjector } from './base-injector';

export interface MulterFileUploadResponse {
  ok: boolean;
  originalName: string;

  /**
   * R2 object key or local generated filename.
   *
   * Examples:
   * files/2026/08/07/uuid-photo.jpg
   * uuid-photo.jpg
   *
   * name change to this to avoid confusion with originalname
   * (similar to originalname with added uniq part)
   */
  savedAs: string;

  size: number;
  mimetype: string;
}

@TaonController<TaonBaseController>({
  className: 'TaonBaseController',
})
export class TaonBaseController<
  UPLOAD_FILE_QUERY_PARAMS = {},
> extends TaonBaseInjector {
  get R2(): R2Bucket {
    return this.ctx?.R2;
  }

  /**
   * Hook that is called when taon app is initialized.
   */
  async afterAllCtxInited(options: {
    ctxStorage: ContextsEndpointStorage;
  }): Promise<void> {}

  //#region upload form data to server

  @POST({
    overrideContentType: 'multipart/form-data',
    middlewares: ({ parentMiddlewares }) => ({
      ...parentMiddlewares,
      TaonBaseFileUploadMiddleware,
    }),
  })
  uploadFormDataToServer(
    @Body() formData: FormData,
    @Query() queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): Models.Http.Response<MulterFileUploadResponse[]> {
    //#region @backendFunc

    return async (req, res) => {
      const resolvedQueryParams =
        queryParams || ({} as UPLOAD_FILE_QUERY_PARAMS);

      if (UtilsOs.isRunningInCloudflareWorker()) {
        const uploadedFiles = await this.uploadFormDataFilesToR2(formData);

        for (const uploadedFile of uploadedFiles) {
          await this.afterFileUploadAction(uploadedFile, resolvedQueryParams);
        }

        return uploadedFiles;
      }

      const files = req.files;

      if (!files || files.length === 0) {
        throw new Error('No file(s) received');
      }

      const responseArr: MulterFileUploadResponse[] = (files as any[]).map(
        file => {
          const savedAbs = crossPlatformPath(path.resolve(file.path));

          return {
            ok: true,
            originalName: file.originalname,
            savedAs: path.basename(savedAbs),
            size: file.size,
            mimetype: file.mimetype,
          };
        },
      );

      for (const uploadedFile of responseArr) {
        await this.afterFileUploadAction(uploadedFile, resolvedQueryParams);
      }

      return responseArr;
    };

    //#endregion
  }

  //#endregion

  //#region upload files to R2

  protected async uploadFormDataFilesToR2(
    formData: FormData,
  ): Promise<MulterFileUploadResponse[]> {
    //#region @backendFunc
    const files = this.extractFilesFromFormData(formData);

    if (files.length === 0) {
      throw new Error('No file(s) received');
    }

    const responseArr: MulterFileUploadResponse[] = [];

    for (const file of files) {
      const savedAs = this.createR2UploadObjectKey(file);

      console.log(`[taon-r2] Uploading "${file.name}" as "${savedAs}"`, {
        size: file.size,
        type: file.type,
        context: this.ctx?.contextName,
        controller: this.constructor.name,
      });

      const result = await this.R2.put(savedAs, file.stream() as any, {
        httpMetadata: {
          contentType: file.type || 'application/octet-stream',
        },

        customMetadata: {
          originalName: file.name,
          controller: this.constructor.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      if (!result) {
        throw new Error(`R2 upload failed for file "${file.name}"`);
      }

      console.log(`[taon-r2] Uploaded "${file.name}" successfully`, {
        key: result.key,
        size: result.size,
        etag: result.etag,
      });

      responseArr.push({
        ok: true,
        originalName: file.name,
        savedAs: result.key,
        size: file.size,
        mimetype: file.type || 'application/octet-stream',
      });
    }

    return responseArr;
    //#endregion
  }

  protected extractFilesFromFormData(formData: FormData): File[] {
    const files: File[] = [];

    // @ts-ignore
    for (const [, value] of formData.entries()) {
      if (this.isUploadedFile(value)) {
        files.push(value);
      }
    }

    return files;
  }

  protected isUploadedFile(value: FormDataEntryValue): value is File {
    return (
      typeof value !== 'string' &&
      typeof value.name === 'string' &&
      typeof value.size === 'number' &&
      typeof value.stream === 'function'
    );
  }

  /**
   * Override this when a controller needs its own R2 path.
   *
   * R2 does not have real directories. Slashes are simply part
   * of the object key, but they behave like folders in tooling.
   */
  protected createR2UploadObjectKey(file: File): string {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    const safeOriginalName = this.sanitizeR2FileName(file.name);

    return [
      this.constructor.name,
      year,
      month,
      day,
      `${crypto.randomUUID()}-${safeOriginalName}`,
    ].join('/');
  }

  protected sanitizeR2FileName(fileName: string): string {
    const sanitized = fileName
      .normalize('NFKD')
      .replace(/[/\\]/g, '-')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return sanitized || 'file';
  }

  //#endregion

  //#region after file upload hook

  /**
   * Hook after a file is uploaded through
   * `uploadFormDataToServer()` or `uploadLocalFileToServer()`.
   */
  protected afterFileUploadAction(
    file?: MulterFileUploadResponse,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): void | Promise<void> {
    // Empty.
  }

  //#endregion

  //#region upload local file to server

  async uploadLocalFileToServer(
    absFilePath: string,
    options?: Pick<Ng2RestAxiosRequestConfig, 'onUploadProgress'>,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): Promise<MulterFileUploadResponse[]> {
    //#region @backendFunc

    const stat = fse.statSync(absFilePath);
    const stream = fse.createReadStream(absFilePath);

    //#region @esmRemove
    const FormData: any = require('form-data');
    //#endregion

    const form = new FormData();

    form.append(
      'file',
      stream as any,
      {
        filename: path.basename(absFilePath),
        knownLength: stat.size,
      } as any,
    );

    const data = await this.uploadFormDataToServer(form, queryParams).request(
      options || {},
    );

    return data.body.json;

    //#endregion
  }

  //#endregion

  //#region wait for proper status change
  // async check() {
  //   await this._waitForProperStatusChange({
  //     request: () => this.uploadFormDataToServer(void 0, void 0).request(),
  //     statusCheck: resp => resp.body.json[0].ok,
  //   });
  // }

  /**
   * Easy way to wait for status change with http (1s default) pooling.
   *
   * example (in sub class):
   * ```ts
      async check() {
          await this.waitForProperStatusChange({
            request: () => this.uploadFormDataToServer(void 0, void 0).request(),
            statusCheck: resp => resp.body.json[0].ok,
          });
        }
   * ```
   */
  public async _waitForProperStatusChange<T>(options: {
    actionName: string;
    /**
     * Request for pooling
     */
    request: (opt?: {
      /**
       * optional index number to identify request in logs
       * (starts from 0 and increments by 1 on each try)
       */
      reqIndexNum?: number;
      httpErrorsCount?: number;
    }) => ReturnType<Models.Http.Response<T>['request']>;
    poolingInterval?: number;
    /**
     * default infinite tries
     */
    maxTries?: number;
    /**
     * default infiniti allowed http errors
     */
    allowedHttpErrors?: number;
    /**
     * condition to be met
     */
    statusCheck?: (
      response: Awaited<ReturnType<typeof options.request>>,
    ) => boolean;
    /**
     * if return true.. loop will continue
     * if false .. will exit the loop
     */
    loopRequestsOnBackendError?: (opt: {
      unknownError: Error;
      unknownHttpError: HttpResponseError<any>;
      taonError: HttpResponseError<RestErrorResponseWrapper>;
      reqIndexNum?: number;
      httpErrorsCount?: number;
    }) => boolean | Promise<boolean>;
  }): Promise<void> {
    const poolingInterval = options.poolingInterval || 1000;
    const taonRequest = options.request;
    let maxTries = options.maxTries || Number.POSITIVE_INFINITY;
    let i = 0;
    let httpErrorsCount = 0;
    while (true) {
      await UtilsTerminal.waitMilliseconds(poolingInterval);
      try {
        const resp = await taonRequest({
          reqIndexNum: i,
          httpErrorsCount,
        });
        if (options.statusCheck && options.statusCheck(resp)) {
          return;
        }
      } catch (error: Error | HttpResponseError | any) {
        httpErrorsCount++;
        if (options.loopRequestsOnBackendError) {
          const isProperTaonError =
            error instanceof HttpResponseError &&
            error.body.json[CoreModels.TaonHttpErrorCustomProp];
          const isHttpError =
            error instanceof HttpResponseError && !isProperTaonError;
          const isUnknownError = !(error instanceof HttpResponseError);

          const resBool = await options.loopRequestsOnBackendError({
            taonError: isProperTaonError ? error : void 0,
            unknownHttpError: isHttpError ? error : void 0,
            unknownError: isUnknownError ? (error as Error) : void 0,
            reqIndexNum: i,
            httpErrorsCount,
          });
          if (resBool) {
            i++;
            continue;
          } else {
            return;
          }
        }
        if (
          httpErrorsCount >
          (options.allowedHttpErrors || Number.POSITIVE_INFINITY)
        ) {
          throw new Error(
            `Too many http errors (${httpErrorsCount}) for "${options.actionName}".`,
          );
        }
      }

      if (i++ > maxTries) {
        throw new Error(
          `Timeout waiting for "${options.actionName}" to be finished. Waited for ${maxTries} seconds`,
        );
      }
    }
  }
  //#endregion
}
