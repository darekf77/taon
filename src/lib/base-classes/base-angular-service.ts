import { isPlatformServer, isPlatformBrowser } from '@angular/common'; // @browser
import { Injectable } from '@angular/core'; // @browser
import { inject, PLATFORM_ID } from '@angular/core'; // @browser

import {
  CURRENT_HOST_BACKEND_PORT,
  CURRENT_HOST_URL,
  TAON_CONTEXT,
} from '../constants';
import { TaonContext } from '../create-context';
import { inject as taonInject } from '../inject';

/**
 * TODO prevent calling methods when not initialized
 * with init(ctx)
 */
//#region @browser
@Injectable()
//#endregion
export abstract class TaonBaseAngularService {
  //#region @browser
  protected readonly platformId = inject(PLATFORM_ID);

  protected readonly currentContext: TaonContext = inject(TAON_CONTEXT);

  /**
   * @deprecated
   * current context host backend port (for localhost backend)
   */
  protected readonly CURRENT_HOST_BACKEND_PORT: number | undefined;

  /**
   * @deprecated
   * current context host URL (for localhost backend)
   */
  protected readonly CURRENT_HOST_URL: string | undefined;

  //#endregion
  constructor() {
    //#region @browser
    this.CURRENT_HOST_BACKEND_PORT = inject(CURRENT_HOST_BACKEND_PORT, {
      optional: true,
    });
    this.CURRENT_HOST_URL = inject(CURRENT_HOST_URL, {
      optional: true,
    });
    // #endregion
  }

  /**
   * Returns true if the application is running in SSR (server-side rendering) mode only.
   */
  public get isSsrPlatform(): boolean {
    //#region @browser
    return isPlatformServer(this.platformId);
    //#endregion
    return false;
  }

  /**
   * Returns true if the application is running in browser-only mode.
   */
  public get isBrowserPlatform(): boolean {
    //#region @browser
    return isPlatformBrowser(this.platformId);
    //#endregion
    return false;
  }

  /**
   * @deprecated
   * Returns the host URL for the backend service
   * that is running on localhost (normal NodeJS/ExpressJS mode).
   */
  get host(): string {
    //#region @browser
    if (this.CURRENT_HOST_URL) {
      return this.CURRENT_HOST_URL;
    }
    return `http://localhost:${this.CURRENT_HOST_BACKEND_PORT}`;
    //#endregion
    return void 0;
  }

  injectController<T>(
    ctor: new (...args: any[]) => T,
    /**
     * optional override context
     */
    overrideCurrentContext?: TaonContext,
  ): T {
    return taonInject(() => {
      let currentContext: TaonContext;
      //#region @browser
      currentContext = overrideCurrentContext
        ? overrideCurrentContext
        : this.currentContext;
      //#endregion
      if (!currentContext) {
        throw new Error(
          'No context available. Make sure to initialize the context before injecting controllers.',
        );
      }
      return currentContext ? currentContext.getClass(ctor) : void 0;
    }) as T;
  }
}
