import { Injectable, inject } from '@angular/core'; // @browser

import { CURRENT_HOST_BACKEND_PORT, TAON_CONTEXT } from '../constants';
import { TaonContext } from '../create-context';
import { inject as taonInject } from '../inject';

/**
 * TODO prevent calling methods when not initialized
 * with init(ctx)
 */
//#region @browser
@Injectable()
//#endregion
export abstract class BaseAngularsService {
  //#region @browser
  protected readonly currentContext: TaonContext = inject(TAON_CONTEXT);
  //#endregion
  protected readonly CURRENT_HOST_BACKEND_PORT: number | undefined;

  constructor() {
    //#region @browser
    this.CURRENT_HOST_BACKEND_PORT = inject(CURRENT_HOST_BACKEND_PORT);
    // #endregion
  }

  /**
   * @deprecated
   * Returns the host URL for the backend service
   * that is running on localhost (normal NodeJS/ExpressJS mode).
   */
  get host(): string {
    return `http://localhost:${this.CURRENT_HOST_BACKEND_PORT}`;
  }

  injectController<T>(ctor: new (...args: any[]) => T): T {
    return taonInject(() => ctor) as T;
  }
}
