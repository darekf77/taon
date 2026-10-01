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
import type { Models } from '../models';

import { TaonBaseFileUploadMiddleware } from './base-file-upload.middleware';
import { TaonBaseInjector } from './base-injector';
//#endregion

@TaonController<TaonBaseController>({
  className: 'TaonBaseController',
})
export class TaonBaseController<
  UPLOAD_FILE_QUERY_PARAMS = {},
  CONTOROLLER = any,
> extends TaonBaseInjector {
  //#region r2 bucket
  get R2(): R2Bucket {
    return this.ctx?.R2;
  }
  //#endregion

  //#region hook before each reaquest
  /**
   * Use this methods for find grain authentication, logs or a
   * anything that needs to happend before each request to controller
   */
  async beforeEachRequest(
    request: Models.TaonCtrlBeforeEachRequestParams<CONTOROLLER>,
  ): Promise<void> {
    // console.log('before each requrest TRIGGERED!', requstData);
  }
  //#endregion

  //#region after all context inited hook
  /**
   * Hook that is called when taon app is initialized.
   */
  async afterAllCtxInited(options: {
    ctxStorage: ContextsEndpointStorage;
  }): Promise<void> {}
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
