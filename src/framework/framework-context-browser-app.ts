import type { FrameworkContext } from './framework-context';
import { Helpers } from 'ng2-logger';
import { Models } from '../models';
import { SYMBOL } from '../symbols';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkContextBase } from './framework-context-base';
import { RealtimeBrowser } from '../realtime';

export class FrameworkContextBrowserApp extends FrameworkContextBase {
  readonly realtime: RealtimeBrowser;
  constructor(
    private context: FrameworkContext) {
    super();
  }

  init() {
    if (Helpers.isBrowser
      //#region @backend
      || this.context.onlyForBackendRemoteServerAccess
      //#endregion
    ) {
      const notFound: Function[] = [];
      const providers = this.context.controllersClasses.filter(ctrl => {

        const e = this.context.initFunc.find(e => ctrl === e.target);
        if (e) {
          // console.log('current controller ', currentCtrl)
          e.initFN();
          return true;
        } else {
          const context: Models.ContextENDPOINT = ctrl.prototype[SYMBOL.CLASS_DECORATOR_CONTEXT];
          if (!context) {
            notFound.push(ctrl);
            return false;
          } else {
            context.initFN();
            return true;
          }
        }
      })
      notFound.forEach(ctrl => {
        throw `Decorator "@ENDPOINT(..)" is missing on class ${CLASS.getName(ctrl)}`;
      });
      providers.forEach(p => this.context.Providers.push(p))
    }

    if (Helpers.isBrowser
      //#region @backend
      || this.context.onlyForBackendRemoteServerAccess
      //#endregion
    ) {
      //@ts-ignore
      this.realtime = new RealtimeBrowser(this.context);
    }

  }

}
