//#region @backend
import 'reflect-metadata';
import { Repository } from 'typeorm';
import { Connection } from 'typeorm';
export { Connection } from 'typeorm';
import { SYMBOL } from '../symbols';
import { CLASS } from 'typescript-class-helpers';
//#endregion

import * as _ from 'lodash';
import { BASE_ENTITY } from './framework-entity';
import { BASE_REPOSITORY } from './framework-repository';
import { FrameworkContext } from './framework-context';

//#region @backend
export function tableNameFrom(entityClass: Function | BASE_ENTITY<any>) {
  entityClass = entityClass as Function;
  return `tb_${entityClass.name.toLowerCase()}`
}
//#endregion

export function classNameVlidation(className, target: Function) {
  if (_.isUndefined(className)) {
    if (FrameworkContext.isProductionMode) {
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
  const context = FrameworkContext.findForTraget(entityFN);
  let repo: Repository<any>;
  if (!!entityFN && !entityFN[SYMBOL.HAS_TABLE_IN_DB]) {
    if (_.isFunction(repoFn)) {
      let repo = context.getInstance(repoFn);
      return repo;
    }
    console.warn(`Repository function not abailable for ${CLASS.getName(entityFN)}`)
    return;
  }

  if (repoFn) {
    repo = connection.getCustomRepository(repoFn);
    let existedRepo = context.getInstance(repoFn);

  } else {
    repo = connection.getRepository(entityFN) as any;
  }
  repo['_'] = {};
  repo['__'] = {};

  const compolexProperties = (repo as BASE_REPOSITORY<any, any>).globalAliases;

  if (Array.isArray(compolexProperties)) {

    compolexProperties.forEach(alias => {
      repo['__'][alias] = {};

      const describedProps = CLASS.describeProperites(entityFN)
      // console.log(`describedProps  "${describedProps}" for ${entity.name}`)

      describedProps.concat(compolexProperties as any).forEach(prop => {
        repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO_NOT_IMPORTANT temp solution
      })

      const props = CLASS.describeProperites(entityFN)
      // console.log(`props  "${props}" for ${entity.name}`)
      props.forEach(prop => {
        repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO_NOT_IMPORTANT ideal solution
      })

    })

    compolexProperties.forEach(alias => {
      repo['_'][alias] = alias; // TODO_NOT_IMPORTANT make it getter with reference
    })
  }

  return repo as any;
}
//#endregion
