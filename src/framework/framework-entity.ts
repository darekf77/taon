
import * as _ from 'lodash';
import { Log } from 'ng2-logger';
import { Global } from '../global-config';
import { SYMBOL } from '../symbols';
import { FormlyArrayTransformFn } from '../crud/fromly';
import { classNameVlidation } from './framework-helpers';
import { Mapping, CLASSNAME, Helpers } from 'ng2-rest';
import { Models } from '../models';

//#region @backend
import {
  InsertEvent, UpdateEvent, RemoveEvent,
  Entity as TypeormEntity, Tree
} from 'typeorm';
import { tableNameFrom } from './framework-helpers';


//#endregion

const log = Log.create('Framework entity')

export function Entity<T = {}>(options?: {
  className?: string;
  defaultModelValues?: Mapping.ModelValue<T>;
  mapping?: Mapping.Mapping<T>;
  additionalMapping?: { [lodashPathes: string]: string | [string]; }
  tree?: 'closure-table';
  formly?: {
    transformFn?: FormlyArrayTransformFn;
    include?: (keyof T)[];
    exclude?: (keyof T)[];
  },
  //#region @backend
  createTable?: boolean;
  browserTransformFn?: (entity: T) => T
  //#endregion
}) {
  if (!options) {
    options = { formly: {} };
  }
  if (!options.formly) {
    options.formly = {}
  }
  let {
    defaultModelValues,
    tree,
    mapping,
    additionalMapping = {},
    className,
    formly: {
      transformFn = undefined,
      include = undefined,
      exclude = undefined
    },
    //#region @backend
    browserTransformFn,
    createTable = true,
    //#endregion
  } = options;
  return function (target: any) {


    className = classNameVlidation(className, target);

    CLASSNAME.CLASSNAME(className)(target)
    Mapping.DefaultModelWithMapping<T>(defaultModelValues, _.merge(mapping, additionalMapping))(target)

    //#region @backend
    if (_.isFunction(browserTransformFn)) {
      const configs = Helpers.Class.getConfig(target)
      const config = _.first(configs);
      config.browserTransformFn = browserTransformFn;
      // console.log('BROWSER TRANSFORM FUNCTION ADDED TO CONFIGS', configs)
    }

    if (createTable) {
      TypeormEntity(tableNameFrom(target))(target)
    }
    target[SYMBOL.HAS_TABLE_IN_DB] = createTable;

    if (_.isString(tree)) {
      Tree("closure-table")(target)
    }
    //#endregion
  }

}

export abstract class BASE_ENTITY<T, TRAW=T, CTRL = {}> {

  abstract id: number;

  /**
   * injected controller for entity for easy coding
   */
  public ctrl: CTRL;
  public static ctrl: any;

  public static fromRaw(obj: any, prototype: Object): any {
    return _.merge(Object.create(prototype), obj);
  }

  fromRaw(obj: TRAW | T): T {
    return _.merge(new (Helpers.Class.getFromObject(this)), obj);
  }

  browserVer() {
    return this;
  }

  private static realtimeEntityListener: { [className: string]: { [entitiesIds: number]: any[]; } } = {} as any;
  private static realtimeEntitySockets: { [className: string]: { [entitiesIds: number]: any } } = {} as any;

  public get realtimeEntity() {
    const self = this;

    return {
      subscribe(changesListener: () => void) {
        // log.i('realtime entity this', self)
        const constructFn = Helpers.Class.getFromObject(self)

        if (!constructFn) {
          log.er(`Activate: Cannot retrive Class function from object`, self)
          return
        }

        const className = Helpers.Class.getName(constructFn);

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

        const constructFn = Helpers.Class.getFromObject(self)
        if (!constructFn) {
          log.er(`Deactivate: Cannot retrive Class function from object`, self)
          return
        }

        const className = Helpers.Class.getName(constructFn);
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

