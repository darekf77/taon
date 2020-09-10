//#region @backend
import { Repository } from 'typeorm';
import { Connection } from 'typeorm';
import * as express from 'express';
import { StartOptions } from './framework-models';
export { Connection } from 'typeorm';
//#endregion
import * as _ from 'lodash';;
import { BASE_CONTROLLER } from './framework-controller';
import { FrameworkContext } from './framework-context';

export function start(options: StartOptions) {
  //#region @backend
  return new Promise<{
    connection?: Connection;
    app?: express.Application;
    controllers?: BASE_CONTROLLER<any>[],
  }>(async (resolve, reject) => {
    //#endregion
    let {
      host,
      controllers = [],
      entities = [],
      disabledRealtime = false,
      allowedHosts,
      //#region @backend
      mode,
      config,
      InitDataPriority,
      publicAssets = [],
      //#endregion
    } = options as StartOptions;

    const context = new FrameworkContext({
      host,
      controllers,
      entities,
      mode,
      disabledRealtime,
      InitDataPriority,
      publicAssets,
      config,
      allowedHosts
    });

    //#region @backend
    await context.initNode();
    //#endregion
    context.initBrowser();
    //#region @backend
    if (context.onlyForBackendRemoteServerAccess) {
      resolve({
        controllers: context.controllersSingletons as any
      })
    } else {
      resolve({
        connection: context.node.connection,
        app: context.node.app,
        controllers: context.controllersSingletons as any
      })
    }
  })
  //#endregion

}
