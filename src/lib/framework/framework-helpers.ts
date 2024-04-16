//#region @backend
import 'reflect-metadata';
//#endregion
//#region @websql
import { Repository } from 'firedev-typeorm/src';
import { Connection } from 'firedev-typeorm/src';
export { Connection } from 'firedev-typeorm/src';
//#endregion
import { SYMBOL } from '../symbols';
import { CLASS } from 'typescript-class-helpers/src';


import { _ } from 'tnp-core/src';
import { BASE_ENTITY } from './framework-entity';
import { BASE_REPOSITORY } from './framework-repository';
import { FrameworkContext } from './framework-context';

//#region @websql
export function tableNameFrom(entityClass: Function | BASE_ENTITY<any>) {
  entityClass = entityClass as Function;
  const className = CLASS.getName(entityClass);
  return className;
}
//#endregion

export function classNameVlidation(className, target: Function) {

  setTimeout(() => {
    // console.log(`check after timeout ${className} , production mode: ${FrameworkContext.isProductionMode}`)
    if (_.isUndefined(className) && FrameworkContext.isProductionMode) {
      throw `[Firedev]
    Please provide "className" property for each Controller and Entity:

        @Firedev.Controller({ className: 'MyExampleCtrl'  })
        class MyExampleCtrl {
          ...
        }

        @Firedev.Entity({ className: 'MyExampleEntity'  })
        class MyExampleEntity {
          ...
        }

  Notice that minified javascript code does not preserve
  Functions/Classes names -this is only solution to preserve classes names.

      `;
    }
  });

  return _.isUndefined(className) ? target.name : className;
}

//#region @websql
export function repositoryFrom<E, R = Repository<E>>(connection: Connection, entityFN: Function, repoFn?: Function): R {
  if (!connection) {
    console.error(`[Firedev][repositoryFrom] no connection!
Please check your Firedev.Repository(...) decorators `, entityFN, repoFn)
    return
  }
  const context = FrameworkContext.findForTraget(entityFN);
  let repo: Repository<any>;
  if (!!entityFN && !entityFN[SYMBOL.HAS_TABLE_IN_DB]) {
    if (_.isFunction(repoFn)) {
      let repo = context.getInstanceBy(repoFn);
      return repo as any;
    }
    console.warn(`Repository function not abailable for ${CLASS.getName(entityFN)}`)
    return;
  }

  if (repoFn) {
    repo = connection.getCustomRepository(repoFn);
    let existedRepo = context.getInstanceBy(repoFn);

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
