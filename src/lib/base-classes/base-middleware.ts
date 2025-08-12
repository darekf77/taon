import type { HttpHandlerFn, HttpRequest } from '@angular/common/http'; // @browser
import type { AxiosRequestConfig } from 'axios';
import type express from 'express';

import { BaseInjector } from './base-injector';

export interface TaonMiddlewareInterceptOptions {
  client?:
    | {
        //#region @browser
        req: AxiosRequestConfig<unknown>;
        // next: HttpHandlerFn;
        //#endregion
      }
    | undefined;
  server?:
    | {
        //#region @websql
        req: express.Request;
        res: express.Response;
        // next: express.NextFunction;
        //#endregion
      }
    | undefined;
}

/**
 * TODO
 * - global provider available in all contexts
 * - provider available in own context
 */
export abstract class BaseMiddleware extends BaseInjector {
  abstract intercept({
    server,
    client,
  }: TaonMiddlewareInterceptOptions): Promise<void>;
}
