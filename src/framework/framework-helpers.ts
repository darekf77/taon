//#region @backend
import "reflect-metadata";
//#endregion
import * as _ from 'lodash';
import { describeClassProperites } from 'ng2-rest';
import { Global } from '../global-config';
import { BASE_ENTITY } from './framework-entity';
import { BASE_REPOSITORY } from './framework-repository';
import { BASE_CONTROLLER } from './framework-controller';
import { init } from '../decorators/decorators-endpoint-class';

//#region @backend
import {
  Repository
} from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { createConnection, createConnections } from 'typeorm';
import * as express from "express";

export { Connection } from 'typeorm';
import { Helpers } from '../helpers';



//#endregion

//#region @backend
export function tableNameFrom(entityClass: Function | BASE_ENTITY<any>) {
  entityClass = entityClass as Function;
  return `tb_${entityClass.name.toLowerCase()}`
}
//#endregion

//#region @backend
export function repositoryFrom<E, R=Repository<E>>(connection: Connection, entity: Function, repository?: Function): R {
  if (!connection) {
    console.error(`[Morphi][repositoryFrom] no connection!
Please check your Morphi.Repository(...) decorators `, entity, repository)
    process.exit(0)
  }
  let repo: Repository<any>;
  if (repository) {
    repo = connection.getCustomRepository(repository);
  } else {
    repo = connection.getRepository(entity) as any;
  }
  repo['_'] = {};
  repo['__'] = {};

  const compolexProperties = (repo as BASE_REPOSITORY<any, any>).globalAliases;

  if (Array.isArray(compolexProperties)) {

    compolexProperties.forEach(alias => {
      repo['__'][alias] = {};

      const describedProps = describeClassProperites(entity)
      // console.log(`describedProps  "${describedProps}" for ${entity.name}`)

      describedProps.concat(compolexProperties as any).forEach(prop => {
        repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO temp solution
      })

      const props = describeClassProperites(entity)
      // console.log(`props  "${props}" for ${entity.name}`)
      props.forEach(prop => {
        repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO ideal solution
      })

    })

    compolexProperties.forEach(alias => {
      repo['_'][alias] = alias; // TODO make it getter with reference
    })
  }

  return repo as any;
}
//#endregion

//#region @backend
export interface IConnectionOptions {
  database: string;
  type: 'sqlite' | 'mysql';
  synchronize: boolean;
  dropSchema: boolean;
  logging: boolean;
}
//#endregion

export interface StartOptions {

  host: string;
  hostSocket?: string;
  controllers: BASE_CONTROLLER<any>[] | Function[];
  entities?: BASE_ENTITY<any>[] | Function[];
  //#region @backend
  config: IConnectionOptions;
  publicAssets?: { path: string; location: string }[];
  InitDataPriority?: BASE_CONTROLLER<any>[] | Function[];
  //#endregion

}

export async function start(options: StartOptions) {
  const {
    host,
    hostSocket,
    controllers,
    entities,
    //#region @backend
    config,
    InitDataPriority,
    publicAssets = [],
    //#endregion
  } = options;
  // console.log(options)

  //#region @backend
  config['entities'] = entities as any;
  // config['subscribers'] = subscribers.concat(_.values(Controllers).filter(a => isRealtimeEndpoint(a as any)))
  //   .concat([META.BASE_CONTROLLER as any]) as any;

  const connections = await createConnections([config] as any);
  // console.log('init connections', connections)
  const connection = connections[0]
  // console.log('init connection', connection)
  //#endregion



  init({
    host,
    hostSocket,
    controllers: controllers as any[],
    entities: entities as any[],
    //#region @backend
    connection
    //#endregion
  })

  //#region @backend


  const app = Global.vars.app;

  publicAssets.forEach(asset => {
    app.use(asset.path, express.static(asset.location))
  })


  let ctrls: BASE_CONTROLLER<any>[] = controllers as any;

  if (InitDataPriority) {
    ctrls = [
      ...(InitDataPriority ? InitDataPriority : []),
      ...(ctrls.filter(f => !(InitDataPriority as BASE_CONTROLLER<any>[]).includes(f)))
    ] as any;
  }


  const promises: Promise<any>[] = []
  ctrls.forEach(ctrl => {
    ctrl = Helpers.getSingleton(ctrl as any);
    if (ctrl && _.isFunction(ctrl.initExampleDbData)) {
      promises.push((ctrl.initExampleDbData()));
    }
  });
  await Promise.all(promises);
  //#endregion
}


