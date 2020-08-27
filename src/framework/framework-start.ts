//#region @backend
import { Repository } from 'typeorm';
import { Connection } from 'typeorm';
import { createConnection, createConnections, getConnection } from 'typeorm';
import * as express from 'express';
import { IConnectionOptions } from './framework-models';
export { Connection } from 'typeorm';
import { Helpers } from '../helpers';
import { SYMBOL } from '../symbols';
import { CLASS } from 'typescript-class-helpers';
//#endregion
import * as _ from 'lodash';
import { GlobalConfig } from '../global-config';
import { BASE_ENTITY } from './framework-entity';
import { BASE_CONTROLLER } from './framework-controller';
import { init } from '../init';


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
      //#region @backend
      mode,
      config,
      InitDataPriority,
      publicAssets = [],
      //#endregion
    } = options as StartOptions;
    // console.log(options)

    //#region @backend
    let withoutBackend = false;
    let testMode = false;
    let onlyForBackendRemoteServerAccess = false;
    switch (mode) {
      case 'backend-only':
        withoutBackend = true;
        break;

      case 'remote-backend':
        onlyForBackendRemoteServerAccess = true;
        break;

      case 'tests':
        testMode = true;
        break;

      default:
        break;
    }

    if (withoutBackend) {
      GlobalConfig.vars.withoutBackend = true;
    }

    if (onlyForBackendRemoteServerAccess) {
      GlobalConfig.vars.startOptions = options;
      GlobalConfig.vars.onlyForBackendRemoteServerAccess = true;
    }

    if (!config) {
      config = {} as any;

      if (mode === 'backend/frontend') {
        console.error(`

        Missing config for backend:


        Morphi.init({
          ...
          config: <YOUR DB CONFIG HERE>
          ...
        })

      `);
      }

      config['entities'] = entities as any;
    }

    if (mode === 'backend/frontend' || mode === 'tests') {
      try {
        const con = await getConnection();

        const connectionExists = !!(con);
        if (connectionExists) {
          console.log('Connection exists')
          await con.close()
        }
      } catch (error) { }


      const connections = await createConnections([config] as any);
      var connection = connections[0]

    }
    //#endregion

    init({
      host,
      controllers: controllers as any[],
      entities: entities as any[],
      //#region @backend
      onlyForBackendRemoteServerAccess,
      connection,
      withoutBackend,
      testMode,
      //#endregion
    })
    //#region @backend
    if (!onlyForBackendRemoteServerAccess) {
      var app = GlobalConfig.vars.app;

      publicAssets.forEach(asset => {
        app.use(asset.path, express.static(asset.location))
      })
    }
    //#endregion

    //#region @backend
    let ctrls: Function[] = controllers as any;

    if (InitDataPriority) {
      ctrls = [
        ...(InitDataPriority ? InitDataPriority : []),
        ...(ctrls.filter(f => !(InitDataPriority as Function[]).includes(f)))
      ] as any;
    }
    ctrls = ctrls.filter(ctrl => !['BASE_CONTROLLER', 'BaseCRUD'].includes(ctrl.name));

    const promises: Promise<any>[] = []
    // console.log('ctrls', ctrls)
    const controllerSingletons = [];

    ctrls.forEach(ctrl => {
      ctrl = Helpers.getSingleton(ctrl as any);
      if (ctrl) {
        controllerSingletons.push(ctrl);
      }
      if (ctrl && _.isFunction((ctrl as any).initExampleDbData)) {
        if (!onlyForBackendRemoteServerAccess) {
          promises.push(((ctrl as any).initExampleDbData()));
        }
      }
    });
    await Promise.all(promises);
    //#endregion

    //#region @backend
    if (onlyForBackendRemoteServerAccess) {
      resolve({ controllers: controllerSingletons })
    } else {
      resolve({ connection, app, controllers: controllerSingletons })
    }
  })
  //#endregion

}


export interface StartOptions {

  host: string;
  controllers?: BASE_CONTROLLER<any>[] | Function[];
  entities?: BASE_ENTITY<any>[] | Function[];

  //#region @backend
  mode?: 'backend/frontend' | 'remote-backend' | 'tests' | 'backend-only';
  // onlyForBackendRemoteServerAccess?: boolean;
  // testMode?: boolean;
  // withoutBackend?: boolean;
  config?: IConnectionOptions;
  publicAssets?: { path: string; location: string }[];
  InitDataPriority?: BASE_CONTROLLER<any>[] | Function[];
  //#endregion

}
