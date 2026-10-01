//#region imports
import { R2Bucket } from '@cloudflare/workers-types';
import {
  RestErrorResponseWrapper,
  RestResponseWrapper,
  HttpResponseError,
  Ng2RestFetchRequestConfig,
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
import type { Models, MulterFileUploadResponse } from '../models';

import { TaonBaseController } from './base-controller';
import { TaonBaseFileUploadMiddleware } from './base-file-upload.middleware';
import { TaonBaseInjector } from './base-injector';
//#endregion

/**
 * @deprecated use TaonBaseStorageController with buckets db
 */
@TaonController<TaonBaseSimpleStorageController>({
  className: 'TaonBaseStorageController',
})
export class TaonBaseSimpleStorageController<
  UPLOAD_FILE_QUERY_PARAMS = {},
  CONTOROLLER = any,
> extends TaonBaseController<UPLOAD_FILE_QUERY_PARAMS, CONTOROLLER> {
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

  // private createUploadProgressStream(
  //   absFilePath: string,
  //   onUploadProgress?: (event: Ng2RestUploadProgressEvent) => void,
  // ) {
  //   const stat = fse.statSync(absFilePath);

  //   const stream = fse.createReadStream(absFilePath);

  //   if (!onUploadProgress) {
  //     return {
  //       stream,
  //       size: stat.size,
  //     };
  //   }

  //   let loaded = 0;

  //   stream.on('data', chunk => {
  //     loaded += chunk.length;

  //     onUploadProgress({
  //       loaded,
  //       total: stat.size,
  //       progress: stat.size > 0 ? loaded / stat.size : 1,
  //     } as any);
  //   });

  //   return {
  //     stream,
  //     size: stat.size,
  //   };
  // }

  //#region upload local file to server

  async uploadLocalFileToServer(
    absFilePath: string,
    // options?: Pick<Ng2RestFetchRequestConfig, 'onUploadProgress'>,
    options?: Ng2RestFetchRequestConfig,
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
}
