import * as _ from 'lodash';
import { isBrowser, Log } from 'ng2-logger';
import { CLASSNAME, getClassFromObject, getClassName } from 'ng2-rest';
import { RealtimeNodejs } from '../realtime/realtime-nodejs';
import { ENDPOINT, __ENDPOINT } from '../decorators/decorators-endpoint-class';
import { BaseCRUD } from '../crud/base-crud-model';
import { Global } from '../global-config';
import { classNameVlidation } from './framework-helpers';
import { SYMBOL } from '../symbols';

//#region @backend
import {
  Repository, EventSubscriber, EntitySubscriberInterface,
  InsertEvent, UpdateEvent, RemoveEvent
} from 'typeorm';
import { EntityEvents } from './framework-entity';
import { AuthCallBack } from '../models';
import { Helpers } from '../helpers';
//#endregion

export function Controller(options?: {
  className?: string;
  realtime?: boolean,
  entity?: Function,
  path?: string,
  autoinit?: boolean,
  //#region @backend
  auth?: AuthCallBack
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
    CLASSNAME(className)(target)
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
  //#region @backend
  implements EntitySubscriberInterface<T>
//#endregion
{

  constructor
    (
      //#region @backend
      private entityEvents: EntityEvents<T> = {}
      //#endregion
    ) {
    super();

    if (isBrowser) {
      // log.i('BASE_CONTROLLER, constructor', this)
    }

    //#region @backend

    this.realtimeEvents = {}
    this.realtimeEvents.afterUpdate = (event) => {

      RealtimeNodejs.populate(event as any);

    }

    //#endregion
  }


  //#region @backend
  private realtimeEvents: EntityEvents<T>;

  protected __realitmeUpdate(model: T) {
    this.realtimeEvents.afterUpdate({ entity: model } as any)
  }

  listenTo() {
    // console.log('listen to ', this.entity)
    return this.entity as any;
  }


  beforeInsert(event: InsertEvent<T>) {
    if (this.entityEvents && _.isFunction(this.entityEvents.beforeInsert)) {
      this.entityEvents.beforeInsert.call(this, event)
    }
  }

  beforeUpdate(event: UpdateEvent<T>) {
    if (this.entityEvents && _.isFunction(this.entityEvents.beforeUpdate)) {
      this.entityEvents.beforeUpdate.call(this, event)
    }
  }


  beforeRemove(event: RemoveEvent<T>) {
    if (this.entityEvents && _.isFunction(this.entityEvents.beforeRemove)) {
      this.entityEvents.beforeRemove.call(this, event)
    }
  }


  afterInsert(event: InsertEvent<T>) {
    if (this.entityEvents && _.isFunction(this.entityEvents.afterInsert)) {
      this.entityEvents.afterInsert.call(this, event)
    }
  }


  afterUpdate(event: UpdateEvent<T>) {
    if (this.entityEvents && _.isFunction(this.entityEvents.afterUpdate)) {
      this.entityEvents.afterUpdate.call(this, event)
    }
  }


  afterRemove(event: RemoveEvent<T>) {
    if (this.entityEvents && _.isFunction(this.entityEvents.afterRemove)) {
      this.entityEvents.afterRemove.call(this, event)
    }
  }


  afterLoad(entity: T) {
    if (this.entityEvents && _.isFunction(this.entityEvents.afterLoad)) {
      this.entityEvents.afterLoad.call(this, entity)
    }
  }


  get db(): { [entities: string]: Repository<any> } {
    throw `db method not implemented ${getClassName(getClassFromObject(this))}`
  }
  get ctrl(): { [controller: string]: BASE_CONTROLLER<any> } {
    throw `ctrl method not implemented ${getClassName(getClassFromObject(this))}`
  }

  abstract async initExampleDbData();

  //#endregion

}

