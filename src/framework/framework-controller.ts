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



export function Controller(options?: {
  className?: string;
  realtime?: boolean,
  entity?: Function,
  path?: string,
  autoinit?: boolean,
  //#region @backend
  auth?: Models.AuthCallBack
  //#endregion
}) {
  let { className, realtime, autoinit = false } = options || {} as any;

  return function (target: Function) {
    //#region @backend
    if (realtime) {
      EventSubscriber()(target)
    }
    //#endregion

    className = classNameVlidation(className, target);
    CLASSNAME.CLASSNAME(className)(target)
    // debugger
    if (autoinit) {
      // console.log(`AUTOINTI!!!!! Options for ${target.name}, partnt ${target['__proto__'].name}`, options)
      __ENDPOINT(target)(target)
    } else {
      // console.log(`Options for ${target.name}, partnt ${target['__proto__'].name}`, options)
      ENDPOINT(options)(target)
    }

  }
}

@Controller({
  className: 'BASE_CONTROLLER',
  autoinit: true
})
export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T>
{

  constructor() {
    super();

    if (_.isFunction(this.entity)) {
      updateChain(this.entity, this as any);
    }

    if (Helpers.isBrowser) {
      // log.i('BASE_CONTROLLER, constructor', this)
    }
  }


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


function updateChain(entity: Function, controllerContext: Object) {
  if (!_.isFunction(entity) ||
    entity.name === 'BASE_ENTITY' ||
    entity.name === 'BaseCRUD'
  ) {
    return;
  }
  entity.prototype['ctrl'] = controllerContext;
  entity['ctrl'] = controllerContext;
  updateChain(entity['__proto__'], controllerContext); // TODO QUICK_FIX
}
