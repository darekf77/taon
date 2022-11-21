//#region @websql
import {
  EventSubscriber
} from 'firedev-typeorm';
//#endregion

import { _ } from 'tnp-core';
import { ENDPOINT, __ENDPOINT } from '../decorators/decorators-endpoint-class';
import { BaseCRUD } from '../crud/base-crud-model';
import { classNameVlidation } from './framework-helpers';
import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkContext } from './framework-context';

const updatedWithCtrl = {};
const updatedStaticWithCtrl = {};

function getSing(target) {
  const context = FrameworkContext.findForTraget(target);
  const res = context.getInstanceBy(target);;
  if (!res) {
    debugger
  }
  return res;
}

function updateChain(entity: Function, target: Function) {
  if (!_.isFunction(entity)) {
    return
  }
  const className = CLASS.getName(entity);

  if (updatedWithCtrl[className]) {
    console.warn(`[Firedev] Property 'ctrl' already exist for ${className}`);
    try {
      Object.defineProperty(entity.prototype, 'ctrl', {
        get: function () {
          return getSing(target);
        }
      })
    } catch (error) { }
  } else {
    updatedWithCtrl[className] = true;
    Object.defineProperty(entity.prototype, 'ctrl', {
      get: function () {
        return getSing(target);
      }
    })
  }
  if (updatedStaticWithCtrl[className]) {
    console.warn(`[Firedev] Static property 'ctrl' already exist for ${className}`);
    try {
      Object.defineProperty(entity, 'ctrl', {
        get: function () {
          return getSing(target);
        }
      })
    } catch (error) { }
  } else {
    updatedStaticWithCtrl[className] = true;
    Object.defineProperty(entity, 'ctrl', {
      get: function () {
        return getSing(target);
      }
    })
  }


}

export function Controller(options?: {
  className?: string;
  /**
   * typeorm realtime subscribtion // TODO disabled for now, does not make sense ?s
   */
  // realtime?: boolean,
  /**
   * Entity required fro CRUD functions
   */
  entity?: Function,
  // additionalEntities?: Function[],
  /**
   * override default path for controller api
   */
  path?: string,
  autoinit?: boolean,
  //#region @websql
  auth?: Models.AuthCallBack
  //#endregion
}) {
  let { className, realtime, autoinit = false, entity, additionalEntities } = options || {} as any;

  return function (target: Function) {
    //#region @websql
    if (realtime) {
      EventSubscriber()(target)
    }
    //#endregion

    // console.log(`classname for ${className}`)

    className = classNameVlidation(className, target);
    CLASS.NAME(className)(target);

    // if (Helpers.isBrowser && _.isFunction(rep)) {
    //   target = rep;
    // }


    // debugger
    if (autoinit) {
      // console.log(`AUTOINTI!!!!! Options for ${target.name}, partnt ${target['__proto__'].name}`, options)
      __ENDPOINT(target)(target)
    } else {
      // console.log(`Options for ${target.name}, partnt ${target['__proto__'].name}`, options)
      ENDPOINT(options)(target)
    }

    if (_.isArray(additionalEntities)) {
      additionalEntities.forEach(c => {
        updateChain(c, target)
      })
    }
    if (_.isFunction(entity)) {
      updateChain(entity, target);
    }
    return target as any;
  }
}

//#region @websql
export interface BASE_CONTROLLER_INIT {
  initExampleDbData?: (isWoker?: boolean) => Promise<any>;
}
//#endregion

@Controller({
  className: 'BASE_CONTROLLER',
  autoinit: true
})
export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T>
  //#region @websql
  implements BASE_CONTROLLER_INIT
//#endregion
{
  /**
   * Controller entites
   */
  entites: Function[];


  //#region @websql

  // get db(): { [entities: string]: Repository<any> } {
  //   throw `db method not implemented ${CLASS.getNameFromObject(this)}`
  // }
  // get ctrl(): { [controller: string]: BASE_CONTROLLER<any> } {
  //   throw `ctrl method not implemented ${CLASS.getNameFromObject(this)}`
  // }

  async initExampleDbData(isWorker = false) {

  }

  //#endregion

}
