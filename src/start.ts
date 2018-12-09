//#region @backend
import * as _ from "lodash";
import * as express from "express";
import "reflect-metadata";

declare const ENV: any;

// import { init, getSingleton, isRealtimeEndpoint } from 'morphi';
import { createConnection, useContainer, ConnectionOptions, Connection } from 'typeorm';
export { Connection } from 'typeorm';
import { META } from "./meta-info";
import { isRealtimeEndpoint, init } from './decorators/decorators-endpoint-class';
import { HelpersBackend, Helpers } from './helpers';
import { Global } from './global-config';

export interface IConnectionOptions {
  database: string;
  type: 'sqlite' | 'mysql';
  synchronize: boolean;
  dropSchema: boolean;
  logging: boolean;
}

export interface StartOptions {
  config: IConnectionOptions;
  host: string;
  hostSocket?: string;
  publicFilesFolder?: string;
  Controllers: META.BASE_CONTROLLER<any>[];
  Entities?: META.BASE_ENTITY<any>[];
  InitDataPriority?: META.BASE_CONTROLLER<any>[];
}

export async function start(options: StartOptions) {
  const { config, host, Controllers, Entities, InitDataPriority, publicFilesFolder, hostSocket } = options;

  config['entities'] = Entities as any;
  // config['subscribers'] = subscribers.concat(_.values(Controllers).filter(a => isRealtimeEndpoint(a as any)))
  //   .concat([META.BASE_CONTROLLER as any]) as any;
  const connection = await createConnection(config as any);


  init({
    host,
    hostSocket,
    controllers: Controllers as any[],
    entities: Entities as any[],
    connection
  })

  const rootPathStaticFiles = ENV.pathes.backup.assets;

  const app = Global.vars.app;

  app.use(publicFilesFolder, express.static(rootPathStaticFiles))

  let ctrls: META.BASE_CONTROLLER<any>[] = Controllers as any;
  ctrls = [
    ...(InitDataPriority ? InitDataPriority : []),
    ...(ctrls.filter(f => !InitDataPriority.includes(f)))
  ];

  const promises: Promise<any>[] = []
  ctrls.forEach(ctrl => {
    ctrl = Helpers.getSingleton(ctrl as any);
    if (ctrl && _.isFunction(ctrl.initExampleDbData)) {
      promises.push((ctrl.initExampleDbData()));
    }
  });
  await Promise.all(promises);
}

//#endregion
