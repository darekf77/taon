import { _ } from 'tnp-core';
import { StartOptions } from './framework-models';
import { FrameworkContext } from './framework-context';
import { Helpers } from 'tnp-core';
import axios from 'axios';

export function start(options: StartOptions) {
  //#region @backend
  return new Promise<FrameworkContext>(async (resolve, reject) => {
    //#endregion
    let {
      host,
      controllers = [],
      entities = [],
      disabledRealtime,
      allowedHosts,
      session,
      //#region @backend
      mode,
      config,
      InitDataPriority,
      publicAssets = [],
      middlewares = [],
      //#endregion
    } = options as StartOptions;
    //#region @backend
    if (_.isUndefined(mode)) {
      mode = 'backend/frontend';
    }
    //#endregion

    if (session) {
      const oneHour = 1000 * 60 * 60 * 1; // 24;
      if (!session.maxAge) {
        session.maxAge = oneHour;
      }
      if (Helpers.isBrowser) {
        axios.defaults.withCredentials = true;
      }
    }
    const context = new FrameworkContext({
      host,
      controllers,
      entities,
      allowedHosts,
      disabledRealtime,
      session,
      //#region @backend
      mode,
      InitDataPriority,
      publicAssets,
      config,
      middlewares,
      //#endregion
    });

    //#region @backend
    await context.initNode();
    //#endregion
    context.initBrowser();
    if (Helpers.isBrowser) {
      return context;
    }
    //#region @backend
    resolve(context);
  })
  //#endregion

}
