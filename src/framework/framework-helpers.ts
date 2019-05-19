//#region @backend
import "reflect-metadata";
//#endregion
import * as _ from 'lodash';
import { Global } from '../global-config';
import { BASE_ENTITY } from './framework-entity';
import { BASE_REPOSITORY } from './framework-repository';
import { BASE_CONTROLLER } from './framework-controller';
import { init } from '../init';

//#region @backend
import {
  Repository
} from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
import { createConnection, createConnections, getConnection } from 'typeorm';
import * as express from "express";

export { Connection } from 'typeorm';
import { Helpers } from '../helpers';
import { SYMBOL } from '../symbols';
import { CLASS } from 'typescript-class-helpers';



//#endregion

//#region @backend
export function tableNameFrom(entityClass: Function | BASE_ENTITY<any>) {
  entityClass = entityClass as Function;
  return `tb_${entityClass.name.toLowerCase()}`
}
//#endregion

export function classNameVlidation(className, target: Function) {
  if (_.isUndefined(className)) {
    if (Global.vars.isProductionMode) {
      throw `[Morphi] Please provide "className" property for each Controller and Entity:

      @Morphi.Controller({ className: 'MyExampleCtrl'  })
      class MyExampleCtrl {
        ...
      }

      @Morphi.Entity({ className: 'MyExampleEntity'  })
      class MyExampleEntity {
        ...
      }
    `
    }
    className = target.name;
  }
  return className
}

//#region @backend
export function repositoryFrom<E, R = Repository<E>>(connection: Connection, entityFN: Function, repoFn?: Function): R {
  if (!connection) {
    console.error(`[Morphi][repositoryFrom] no connection!
Please check your Morphi.Repository(...) decorators `, entityFN, repoFn)
    return
  }
  let repo: Repository<any>;
  if (!!entityFN && !entityFN[SYMBOL.HAS_TABLE_IN_DB]) {
    if (_.isFunction(repoFn)) {
      let repo = CLASS.getSingleton(repoFn)
      if (!repo) {
        CLASS.setSingletonObj(repoFn, new (repoFn as any)())
      }
      repo = CLASS.getSingleton(repoFn)
      return repo;
    }
    console.warn(`Repository function not abailable for ${CLASS.getName(entityFN)}`)
    return;
  }

  if (repoFn) {
    repo = connection.getCustomRepository(repoFn);
    let existedRepo = CLASS.getSingleton(repoFn)
    if(!existedRepo) {
      CLASS.setSingletonObj(repoFn, repo);
    }

  } else {
    repo = connection.getRepository(entityFN) as any;
  }
  repo['_'] = {};
  repo['__'] = {};

  const compolexProperties = (repo as BASE_REPOSITORY<any, any>).globalAliases;

  if (Array.isArray(compolexProperties)) {

    compolexProperties.forEach(alias => {
      repo['__'][alias] = {};

      const describedProps = Helpers.Class.describeProperites(entityFN)
      // console.log(`describedProps  "${describedProps}" for ${entity.name}`)

      describedProps.concat(compolexProperties as any).forEach(prop => {
        repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO temp solution
      })

      const props = Helpers.Class.describeProperites(entityFN)
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
  controllers?: BASE_CONTROLLER<any>[] | Function[];
  entities?: BASE_ENTITY<any>[] | Function[];
  //#region @backend
  config?: IConnectionOptions;
  testMode?: boolean;
  publicAssets?: { path: string; location: string }[];
  InitDataPriority?: BASE_CONTROLLER<any>[] | Function[];
  //#endregion

}

export function start(options: StartOptions) {
  //#region @backend
  return new Promise(async (resolve, reject) => {
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
    ctrls.forEach(ctrl => {
      ctrl = Helpers.getSingleton(ctrl as any);
      if (ctrl && _.isFunction((ctrl as any).initExampleDbData)) {
        promises.push(((ctrl as any).initExampleDbData()));
      }
    });
    await Promise.all(promises);
    //#endregion

    //#region @backend
    resolve()
  })
  //#endregion

}


