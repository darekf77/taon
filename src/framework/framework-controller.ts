//#region @backend
import {
  Repository, EventSubscriber, EntitySubscriberInterface,
  InsertEvent, UpdateEvent, RemoveEvent
} from 'typeorm';
//#endregion

import * as _ from 'lodash';
import { RealtimeNodejs } from '../realtime/realtime-nodejs';
import { ENDPOINT, __ENDPOINT, CLASSNAME } from '../decorators/decorators-endpoint-class';
import { BaseCRUD } from '../crud/base-crud-model';
import { classNameVlidation } from './framework-helpers';
import { Models } from '../models';
import { Helpers } from '../helpers';
import { CLASS } from 'typescript-class-helpers';

const updatedWithCtrl = {};
const updatedStaticWithCtrl = {};
function updateChain(entity: Function, target: Function) {
  if (!_.isFunction(entity)) {
    return
  }
  const className = CLASS.getName(entity);
  // console.log(`Entity ${entity.name} shoudl have controler singleton ${target.name}`)


  if (updatedWithCtrl[className]) {
    console.warn(`[morphi] Property 'ctrl' already exist for ${className}`);
    try {
      Object.defineProperty(entity.prototype, 'ctrl', {
        get: function () {
          return CLASS.getSingleton(target);
        }
      })
    } catch (error) { }
  } else {
    updatedWithCtrl[className] = true;
    Object.defineProperty(entity.prototype, 'ctrl', {
      get: function () {
        return CLASS.getSingleton(target);
      }
    })
  }
  if (updatedStaticWithCtrl[className]) {
    console.warn(`[morphi] Static property 'ctrl' already exist for ${className}`);
    try {
      Object.defineProperty(entity, 'ctrl', {
        get: function () {
          return CLASS.getSingleton(target);
        }
      })
    } catch (error) { }
  } else {
    updatedStaticWithCtrl[className] = true;
    Object.defineProperty(entity, 'ctrl', {
      get: function () {
        return CLASS.getSingleton(target);
      }
    })
  }


}

export function Controller(options?: {
  className?: string;
  realtime?: boolean,
  entity?: Function,
  additionalEntities?: Function[],
  path?: string,
  autoinit?: boolean,
  //#region @backend
  auth?: Models.AuthCallBack
  //#endregion
}) {
  let { className, realtime, autoinit = false, entity, additionalEntities } = options || {} as any;

  return function (target: Function) {
    //#region @backend
    if (realtime) {
      EventSubscriber()(target)
    }
    //#endregion

    className = classNameVlidation(className, target);
    CLASSNAME.CLASSNAME(className, {
      singleton: Helpers.isBrowser,
      autoinstance: Helpers.isBrowser,
    })(target);

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

@Controller({
  className: 'BASE_CONTROLLER',
  autoinit: true
})
export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T>
{
  /**
   * Controller entites
   */
  entites: Function[];

  // constructor() {
  //   super();

  //   if (Helpers.isBrowser) {
  //     // log.i('BASE_CONTROLLER, constructor', this)
  //     const Class = CLASS.getFromObject(this);
  //     console.log(`Set singleton for ${CLASS.getName(Class)}`)
  //     CLASS.setSingletonObj(Class, this)
  //   }
  // }


  //#region @backend

  get db(): { [entities: string]: Repository<any> } {
    throw `db method not implemented ${Helpers.Class.getNameFromObject(this)}`
  }
  get ctrl(): { [controller: string]: BASE_CONTROLLER<any> } {
    throw `ctrl method not implemented ${Helpers.Class.getNameFromObject(this)}`
  }

  async initExampleDbData() {

  }

  //#endregion

}



