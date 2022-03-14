import { _ } from 'tnp-core';
import { StartOptions } from './framework-models';
import { FrameworkContext } from './framework-context';
import { Helpers } from 'tnp-core';

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
      //#region @backend
      mode,
      config,
      InitDataPriority,
      publicAssets = [],
      //#endregion
    } = options as StartOptions;
    //#region @backend
    if (_.isUndefined(mode)) {
      mode = 'backend/frontend';
    }
    //#endregion

    const context = new FrameworkContext({
      host,
      controllers,
      entities,
      allowedHosts,
      disabledRealtime,
      //#region @backend
      mode,
      InitDataPriority,
      publicAssets,
      config,
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
