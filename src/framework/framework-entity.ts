
import * as _ from 'lodash';
import { Log } from 'ng2-logger';
import {
  getClassName, getClassFromObject,
  DefaultModelWithMapping,
  Mapping, ModelValue, CLASSNAME
} from 'ng2-rest';
import { Global } from '../global-config';
import { SYMBOL } from '../symbols';
import { FormlyForm, FormlyArrayTransformFn } from '../crud/fromly';

//#region @backend
import {
  InsertEvent, UpdateEvent, RemoveEvent,
  Entity as TypeormEntity
} from 'typeorm';
import { tableNameFrom } from './framework-helpers';
//#endregion

const log = Log.create('Framework entity')

export function Entity<T = {}>(options: {
  className?: string;
  defaultModelValues?: ModelValue<T>,
  mapping?: Mapping<T>
  genereateFormly?: boolean;
  formly?: {
    transformFn?: FormlyArrayTransformFn,
    include?: (keyof T)[],
    exclude?: (keyof T)[]
  },
  //#region @backend
  createTable?: boolean;
  //#endregion
}) {
  if (!options) {
    options = {}
  }
  if (!options.formly) {
    options.formly = {}
  }
  const {
    genereateFormly = true,
    defaultModelValues,
    mapping,
    className,
    formly: {
      transformFn = undefined,
      include = undefined,
      exclude = undefined
    },
    //#region @backend
    createTable = true,
    //#endregion
  } = options;
  return function (target: any) {

    //#region @backend
    if (createTable) {
      TypeormEntity(tableNameFrom(target))(target)
    }
    //#endregion
    if (genereateFormly) {
      FormlyForm<T>(transformFn, exclude, include)(target)
    }
    DefaultModelWithMapping<T>(defaultModelValues, mapping)(target)
    CLASSNAME(className)(target)
  }

}

export abstract class BASE_ENTITY<T, TRAW=T> {

  abstract id: number;

  public static fromRaw(obj: any, prototype: Object): any {
    return _.merge(Object.create(prototype), obj);
  }

  abstract fromRaw(obj: TRAW | T): T;



  private static realtimeEntityListener: { [className: string]: { [entitiesIds: number]: any[]; } } = {} as any;
  private static realtimeEntitySockets: { [className: string]: { [entitiesIds: number]: any } } = {} as any;

  public get realtimeEntity() {
    const self = this;

    return {
      subscribe(changesListener: () => void) {
        // log.i('realtime entity this', self)
        const constructFn = getClassFromObject(self)

        if (!constructFn) {
          log.er(`Activate: Cannot retrive Class function from object`, self)
          return
        }

        const className = getClassName(constructFn);

        if (!BASE_ENTITY.realtimeEntitySockets[className]) {
          BASE_ENTITY.realtimeEntitySockets[className] = {};
        }

        if (!BASE_ENTITY.realtimeEntityListener[className]) {
          BASE_ENTITY.realtimeEntityListener[className] = {};
        }

        if (!_.isArray(BASE_ENTITY.realtimeEntityListener[className][self.id])) {
          BASE_ENTITY.realtimeEntityListener[className][self.id] = [];
        }

        if (_.isObject(BASE_ENTITY.realtimeEntitySockets[className][self.id])) {
          log.w('alread listen to this object realtime events', self)
          if (!BASE_ENTITY.realtimeEntityListener[className][self.id].includes(changesListener)) {
            log.d('new change listener added', self)
            BASE_ENTITY.realtimeEntityListener[className][self.id].push(changesListener);
          } else {
            log.d('change listener already exist', self)
          }
          return
        }
        const roomName = SYMBOL.REALTIME.ROOM_NAME(className, self.id);
        const realtime = Global.vars.socketNamespace.FE_REALTIME;
        const ngZone = Global.vars.ngZone;



        // realtime.on('connect', () => {
        //   console.log(`conented to namespace ${realtime.nsp && realtime.nsp.name}`)

        realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE_ENTITY_EVENTS, roomName)
        console.log('SUBSCRIBE TO ' + SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, self.id))
        let sub = realtime.on(SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, self.id), (data) => {
          const cb = _.debounce(() => {
            if (_.isFunction(changesListener)) {
              BASE_ENTITY.realtimeEntityListener[className][self.id].forEach(cl => {
                cl(BASE_ENTITY.fromRaw(data, constructFn.prototype))
              })
            } else {
              log.er('Please define changedEntity')
            }
          }, 1000);

          log.i('data from socket without preparation (ngzone,rjxjs,transform)', data)
          if (ngZone) {
            ngZone.run(() => {
              log.d('next from ngzone')
              cb()
            })
          } else {
            log.d('next without ngzone')
            cb()
          }
          // if (ApplicationRef) {
          //   log.i('tick application ')
          //   ApplicationRef.tick()
          // }

        })


        BASE_ENTITY.realtimeEntitySockets[className][self.id] = sub;
        BASE_ENTITY.realtimeEntityListener[className][self.id].push(changesListener);


      },
      unsubscribe() {

        const constructFn = getClassFromObject(self)
        if (!constructFn) {
          log.er(`Deactivate: Cannot retrive Class function from object`, self)
          return
        }

        const className = getClassName(constructFn);
        const roomName = SYMBOL.REALTIME.ROOM_NAME(className, self.id);

        const sub = BASE_ENTITY.realtimeEntitySockets[className] && BASE_ENTITY.realtimeEntitySockets[className][self.id];
        if (!sub) {
          log.w(`No sunscribtion for entity with id ${self.id}`)
        } else {
          sub.removeAllListeners()
          BASE_ENTITY.realtimeEntitySockets[self.id] = undefined;
        }

        BASE_ENTITY.realtimeEntityListener[className][self.id] = undefined;

        const realtime = Global.vars.socketNamespace.FE_REALTIME;
        realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE_ENTITY_EVENTS, roomName)

      }

    }
  }




}

//#region @backend
export interface EntityEvents<T =any> {
  beforeInsert?: (event: InsertEvent<T>) => void;
  beforeUpdate?: (event: UpdateEvent<T>) => void;
  beforeRemove?: (event: RemoveEvent<T>) => void;
  afterInsert?: (event: InsertEvent<T>) => void;
  afterUpdate?: (event: UpdateEvent<T>) => void;
  afterRemove?: (event: RemoveEvent<T>) => void;
  afterLoad?: (entity: T) => void;
};
//#endregion

