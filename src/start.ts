//#region @backend
import * as _ from "lodash";
import * as express from "express";
import "reflect-metadata";

// import { init, getSingleton, isRealtimeEndpoint } from 'morphi';
import { createConnections, useContainer, ConnectionOptions, Connection } from 'typeorm';
export { Connection } from 'typeorm';
import { META } from "./meta-info";
import { isRealtimeEndpoint, init } from './decorators/decorators-endpoint-class';
import { getSingleton } from './helpers';

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
  const connection = await createConnections([config] as any);
  const firstConnection = connection[0];

  const app = init({
    host,
    hostSocket,
    controllers: Controllers as any[],
    entities: Entities as any[]
  }).expressApp(firstConnection as any)

  const rootPathStaticFiles = ENV.pathes.backup.assets;

  app.use(publicFilesFolder, express.static(rootPathStaticFiles))

  let ctrls: META.BASE_CONTROLLER<any>[] = Controllers as any;
  ctrls = [
    ...(InitDataPriority ? InitDataPriority : []),
    ...(ctrls.filter(f => !InitDataPriority.includes(f)))
  ];

  const promises: Promise<any>[] = []
  ctrls.forEach(ctrl => {
    ctrl = getSingleton(ctrl as any);
    if (ctrl && _.isFunction(ctrl.initExampleDbData)) {
      promises.push((ctrl.initExampleDbData()));
    }
  });
  await Promise.all(promises);

  return {
    connection: firstConnection,
    config,
    entities: Entities
  };
}

//#endregion
