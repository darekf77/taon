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
  constructor() {

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
      currentContext = overrideCurrentContext ? overrideCurrentContext : this.currentContext;
      //#endregion
      if (!currentContext) {
        throw new Error(
          'No context available. Make sure to initialize the context before injecting controllers.',
        );
      }
      return currentContext ? currentContext.getClass(ctor): void 0;
    }) as T;
  }
}
