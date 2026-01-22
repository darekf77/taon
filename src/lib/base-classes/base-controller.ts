import * as FormData from 'form-data'; // @backend
import {
  RestErrorResponseWrapper,
  RestResponseWrapper,
  HttpResponseError,
} from 'ng2-rest/src';
import { Models as Ng2RestModels } from 'ng2-rest/src';
import {
  CoreModels,
  crossPlatformPath,
  fse,
  Helpers,
  path,
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
  /**
   * Hook that is called when taon app is inited
   * (all contexts are created and inited)
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
      const files = req.files;
      if (!files) {
        throw 'No file(s) received';
      }
      const responseArr = (files as any[]).map(f => {
        const savedAbs = crossPlatformPath(path.resolve(f.path));
        // const savedRel = crossPlatformPath(
        //   path.relative(this.ctx.cwd, savedAbs),
        // );
        return {
          ok: true,
          originalName: f.originalname,
          savedAs: path.basename(savedAbs),
          // savedPath: void 0, // not needed
          size: f.size,
          mimetype: f.mimetype,
        };
      });
      // console.log(responseArr);
      for (const res of responseArr) {
        await this.afterFileUploadAction(res, queryParams || ({} as any));
      }
      return responseArr;
    };
    //#endregion
  }
  //#endregion

  //#region after file upload hook
  /**
   * Hook after file is uploaded
   * through `uploadFormDataToServer` or `uploadLocalFileToServer`
   */
  protected afterFileUploadAction(
    file?: MulterFileUploadResponse,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): void | Promise<void> {
    // empty
  }

  //#region upload local file to server
  async uploadLocalFileToServer(
    absFilePath: string,
    options?: Pick<Ng2RestModels.Ng2RestAxiosRequestConfig, 'onUploadProgress'>,
    queryParams?: UPLOAD_FILE_QUERY_PARAMS,
  ): Promise<MulterFileUploadResponse[]> {
    //#region @backendFunc
    const stat = fse.statSync(absFilePath);
    const stream = fse.createReadStream(absFilePath);

    const form = new FormData();
    form.append('file', stream, {
      filename: path.basename(absFilePath),
      knownLength: stat.size,
    });

    const data = await this.uploadFormDataToServer(form, queryParams).request(
      options || {},
    );
    return data.body.json;
    //#endregion
  }
  //#endregion

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
}
