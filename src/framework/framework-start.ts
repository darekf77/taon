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
import { Global } from '../global-config';
import { BASE_ENTITY } from './framework-entity';
import { BASE_REPOSITORY } from './framework-repository';
import { BASE_CONTROLLER } from './framework-controller';
import { init } from '../init';


export function start(options: StartOptions) {
  //#region @backend
  return new Promise<{
    connection: Connection;
    app: express.Application;
    controllers: BASE_CONTROLLER<any>[],
  }>(async (resolve, reject) => {
    //#endregion
    let {
      host,
      controllers = [],
      entities = [],
      //#region @backend
      config,
      InitDataPriority,
      publicAssets = [],
      testMode = false,
      //#endregion
    } = options as any;
    // console.log(options)

    //#region @backend
    if (!config) {
      config = {} as any;
      console.error(`

        Missing config for backend:


        Morphi.init({
          ...
          config: <YOUR DB CONFIG HERE>
          ...
        })

      `)
    }
    config['entities'] = entities as any;
    // config['subscribers'] = subscribers.concat(_.values(Controllers).filter(a => isRealtimeEndpoint(a as any)))
    //   .concat([META.BASE_CONTROLLER as any]) as any;

    try {
      const con = await getConnection();

      const connectionExists = !!(con);
      if (connectionExists) {
        console.log('Connection exists')
        await con.close()
      }
    } catch (error) {

    }



    const connections = await createConnections([config] as any);
    // console.log('init connections', connections)
    const connection = connections[0]
    // console.log('init connection', connection)
    //#endregion

    init({
      host,
      controllers: controllers as any[],
      entities: entities as any[],
      //#region @backend
      connection,
      testMode,
      //#endregion
    })

    //#region @backend


    const app = Global.vars.app;

    publicAssets.forEach(asset => {
      app.use(asset.path, express.static(asset.location))
    })


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
      if (ctrl && _.isFunction((ctrl as any).initExampleDbData)) {
        controllerSingletons.push(ctrl);
        promises.push(((ctrl as any).initExampleDbData()));
      }
    });
    await Promise.all(promises);
    //#endregion

    //#region @backend
    resolve({ connection, app, controllers: controllerSingletons  })
  })
  //#endregion

}


export interface StartOptions {

  host: string;
  controllers?: BASE_CONTROLLER<any>[] | Function[];
  entities?: BASE_ENTITY<any>[] | Function[];
  //#region @backend
  onlyForBackendRemoteServerAccess?: boolean;
  config?: IConnectionOptions;
  testMode?: boolean;
  publicAssets?: { path: string; location: string }[];
  InitDataPriority?: BASE_CONTROLLER<any>[] | Function[];
  //#endregion

}
