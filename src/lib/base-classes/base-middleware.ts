import type { HttpHandlerFn, HttpRequest } from '@angular/common/http'; // @browser
import type express from 'express';

import { BaseInjector } from './base-injector';
/**
 * TODO
 * - global provider available in all contexts
 * - provider available in own context
 */
export class BaseMiddleware extends BaseInjector {
  //#region @browser
  async interceptClient(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Promise<void> {
    // TODO
    next(req);
  }
  //#endregion

  //#region @backend
  async interceptServer(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> {
    // TODO
    next();
  }
  //#endregion
}
