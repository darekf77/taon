import * as _ from 'lodash';
import * as io from 'socket.io-client';

import { GlobalConfig } from '../global-config';
import { SYMBOL } from '../symbols';

import { Log, Level } from 'ng2-logger';
import { Helpers } from '../helpers';
import { BASE_ENTITY } from '../framework/framework-entity';
import { CLASS } from 'typescript-class-helpers';
import { RealtimeHelper } from './realtime-helper';
import { Morphi } from '..';
const log = Log.create('RealtimeBrowser',
  // Level.__NOTHING
);

export type AliasChangeListenerType = (unsubscribe: () => void) => void;
export type AliasEntityType = Partial<BASE_ENTITY<any>>;

export class RealtimeBrowser {
  private static connected = false;
  static init(hostForRealtime: string) {
    if (Morphi.IsBrowser) {
      if (RealtimeBrowser.connected) {
        log.warn('BROWSER ALREADY CONNECTED!')
        return
      }
      RealtimeBrowser.connected = true;
    }

    // RealtimeHelper.pathFor(SYMBOL.REALTIME.NAMESPACE).hostname
    const nspPath = {
      global: RealtimeHelper.pathFor(void 0, hostForRealtime),
      realtime: RealtimeHelper.pathFor(SYMBOL.REALTIME.NAMESPACE, hostForRealtime)
    };

    log.i('NAMESPACE GLOBAL', nspPath.global.href)
    log.i('NAMESPACE REALTIME', nspPath.realtime.href)

    const global = io(nspPath.global.origin, {
      path: nspPath.global.pathname
    });
    GlobalConfig.vars.socketNamespace.FE = global as any;

    global.on('connect', () => {
      log.i(`conented to GLOBAL namespace ${global.nsp}`)
    });
    log.i('IT SHOULD CONNECT TO GLOBAL')


    const realtime = io(nspPath.realtime.origin, {
      path: nspPath.realtime.pathname
    }) as any;

    GlobalConfig.vars.socketNamespace.FE_REALTIME = realtime;

    realtime.on('connect', () => {
      log.i(`conented to REALTIME namespace ${realtime.nsp}`)
    });

    log.i('IT SHOULD CONNECT TO REALTIME')

  }


  private static realtimeEntityListener: { [className: string]: { [entitiesIds: number]: any[]; } } = {} as any;
  private static realtimeEntityPropertyListener: { [className: string]: { [propertyInEntityIds: string]: any[]; } } = {} as any;

  private static realtimeEntitySockets: { [className: string]: { [entitiesIds: number]: any } } = {} as any;
  private static realtimeEntityPropertySockets: { [className: string]: { [propertyInEntityIds: string]: any } } = {} as any;


  public static TriggerChange(entity: AliasEntityType, property?: string) {

    const constructFn = CLASS.getFromObject(entity)

    if (!constructFn) {
      log.er(`Activate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = CLASS.getName(constructFn);
    const { id } = entity;

    const unsub = () => {
      if (_.isString(property)) {
        this.UnsubscribeEntityPropertyChanges(entity, property);
      } else {
        this.UnsubscribeEntityChanges(entity);
      }
    }

    if (_.isString(property)) {
      const propertyInEntityKey = propertyInEntityKeyFn(entity, property);
      const arr = RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey];
      if (_.isArray(arr)) {
        arr.forEach(changeListenerFromArray => {
          changeListenerFromArray(unsub)
        })
      }

    } else {
      const arr = RealtimeBrowser.realtimeEntityListener[className][entity.id];
      if (_.isArray(arr)) {
        arr.forEach(changeListenerFromArray => {
          changeListenerFromArray(unsub)
        })
      }
    }
  }

  private static __SubscribeEntityChanges(entity: AliasEntityType, changesListener: AliasChangeListenerType, property?: string) {

    const { id } = entity;
    const propertyInEntityKey = propertyInEntityKeyFn(entity, property);

    if (!_.isNumber(id)) {
      console.error(entity)
      throw `[Morphi.Realtime.Browser.Subscribe] bad id = "${id}" for entity.`
    }

    const constructFn = CLASS.getFromObject(entity)

    if (!constructFn) {
      log.er(`Activate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = CLASS.getName(constructFn);

    this.checkObjects(className, entity, property, changesListener);

    const roomName = _.isString(property) ?
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, entity.id) :
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, entity.id)

    const realtime = GlobalConfig.vars.socketNamespace.FE_REALTIME;
    const ngZone = GlobalConfig.vars.ngZone;



    // realtime.on('connect', () => {
    //   console.log(`conented to namespace ${realtime.nsp && realtime.nsp.name}`)
    if (_.isString(property)) {
      realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
      log.i('SUBSCRIBE TO ' + SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, entity.id))
    } else {
      realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
      log.i('SUBSCRIBE TO ' + SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, entity.id))
    }

    const callback = (data) => {
      const cb = _.debounce(() => {
        if (_.isFunction(changesListener)) {
          const self = this;
          const unsub = () => {
            if (_.isString(property)) {
              this.UnsubscribeEntityPropertyChanges(entity, property);
            } else {
              this.UnsubscribeEntityChanges(entity);
            }
          }

          if (_.isString(property)) {
            const arr = RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey];
            if (_.isArray(arr)) {
              arr.forEach(changeListenerFromArray => {
                changeListenerFromArray(unsub)
              })
            }

          } else {
            const arr = RealtimeBrowser.realtimeEntityListener[className][entity.id];
            if (_.isArray(arr)) {
              arr.forEach(changeListenerFromArray => {
                changeListenerFromArray(unsub)
              })
            }
          }

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
    }

    let sub;

    if (_.isString(property)) {
      sub = realtime.on(SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, entity.id), callback)
      RealtimeBrowser.realtimeEntityPropertySockets[className][propertyInEntityKey] = sub;
      RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey].push(changesListener);
    } else {
      sub = realtime.on(SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, entity.id), callback)
      RealtimeBrowser.realtimeEntitySockets[className][entity.id] = sub;
      RealtimeBrowser.realtimeEntityListener[className][entity.id].push(changesListener);
    }
  }

  public static addDupicateRealtimeEntityListener(entity: AliasEntityType, changesListener: AliasChangeListenerType, property?: string) {
    const className = CLASS.getNameFromObject(entity);
    if (_.isUndefined(RealtimeBrowser.realtimeEntityPropertyListener[className])) {
      RealtimeBrowser.realtimeEntityPropertyListener[className] = {};
    }
    if (_.isString(property)) {
      const propertyInEntityKey = propertyInEntityKeyFn(entity, property)
      RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey].push(changesListener);
    } else {
      RealtimeBrowser.realtimeEntityListener[className][entity.id].push(changesListener);
    }
  }
  public static SubscribeEntityChanges(entity: AliasEntityType, changesListener: AliasChangeListenerType) {
    return RealtimeBrowser.__SubscribeEntityChanges(entity, changesListener);
  }

  public static SubscribeEntityPropertyChanges(entity: AliasEntityType, property: string, changesListener: AliasChangeListenerType) {
    return RealtimeBrowser.__SubscribeEntityChanges(entity, changesListener, property);
  }

  private static checkObjects(className: string, entity: Partial<BASE_ENTITY<any>>, property: string, changesListener) {

    if (_.isString(property)) {

      if (_.isUndefined(RealtimeBrowser.realtimeEntityPropertySockets[className])) {
        RealtimeBrowser.realtimeEntityPropertySockets[className] = {};
      }

      if (_.isUndefined(RealtimeBrowser.realtimeEntityPropertyListener[className])) {
        RealtimeBrowser.realtimeEntityPropertyListener[className] = {};
      }

      const propertyInEntityKey = propertyInEntityKeyFn(entity, property);


      if (!_.isArray(RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey])) {
        RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey] = [];
      }

      if (_.isObject(RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey])) {
        log.w(`alread listen to this object property: ${property} realtime events`, entity)
        if (!RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey].includes(changesListener)) {
          log.d(`new change listener added, property: ${property}`, entity)
          RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey].push(changesListener);
        } else {
          log.d(`change listener already exist, property: ${property}`, entity)
        }
        return false
      }


    } else {
      if (_.isUndefined(RealtimeBrowser.realtimeEntitySockets[className])) {
        RealtimeBrowser.realtimeEntitySockets[className] = {};
      }

      if (_.isUndefined(RealtimeBrowser.realtimeEntityListener[className])) {
        RealtimeBrowser.realtimeEntityListener[className] = {};
      }

      if (!_.isArray(RealtimeBrowser.realtimeEntityListener[className][entity.id])) {
        RealtimeBrowser.realtimeEntityListener[className][entity.id] = [];
      }

      if (_.isObject(RealtimeBrowser.realtimeEntitySockets[className][entity.id])) {
        log.w('alread listen to this object realtime events', entity)
        if (!RealtimeBrowser.realtimeEntityListener[className][entity.id].includes(changesListener)) {
          log.d('new change listener added', entity)
          RealtimeBrowser.realtimeEntityListener[className][entity.id].push(changesListener);
        } else {
          log.d('change listener already exist', entity)
        }
        return false
      }
    }

    return true;
  }


  private static __UnsubscribeEntityChanges(entity: AliasEntityType, property?: string, includePropertyChanges = false, classFN?: Function) {

    if (includePropertyChanges) {
      CLASS.describeProperites(CLASS.getFromObject(entity)).forEach(property => {
        this.UnsubscribeEntityPropertyChanges(entity, property)
      })
    }

    const { id } = entity;
    if (!_.isNumber(id)) {
      console.error(entity)
      throw `[Morphi.Realtime.Browser.Unsubscribe] bad id = "${id}" for entity.`
    }

    const constructFn = _.isFunction(classFN) ? classFN : CLASS.getFromObject(entity)
    if (!constructFn) {
      log.er(`Deactivate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = CLASS.getName(constructFn);
    const realtime = GlobalConfig.vars.socketNamespace.FE_REALTIME;

    const roomName = _.isString(property) ?
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, entity.id) :
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, entity.id)

    let sub: any;
    if (_.isString(property)) {
      var propertyInEntityKey = propertyInEntityKeyFn(entity, property);
      sub = RealtimeBrowser.realtimeEntityPropertySockets[className] && RealtimeBrowser.realtimeEntityPropertySockets[className][propertyInEntityKey]
    } else {
      sub = RealtimeBrowser.realtimeEntitySockets[className] && RealtimeBrowser.realtimeEntitySockets[className][entity.id]
    }

    if (sub) {
      sub.removeAllListeners()

      if (_.isString(property)) {
        delete RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey]
      } else {
        delete RealtimeBrowser.realtimeEntityListener[className][entity.id]
      }
      console.info(`Unsubscribe OK from entit: ${className} - ${propertyInEntityKey ? propertyInEntityKey : entity.id}`)
    } else {
      console.info(`Unsubscribe not found from entity: ${className} - ${propertyInEntityKey ? propertyInEntityKey : entity.id}`)
    }

    if (_.isString(property)) {
      realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
    } else {
      realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
    }


  }

  public static UnsubscribeEverything() {
    Object.keys(this.realtimeEntitySockets).forEach(className => {
      Object.keys(this.realtimeEntitySockets[className]).forEach(entityId => {
        this.__UnsubscribeEntityChanges({ id: entityId } as any, undefined, true, CLASS.getBy(className));
      })
    });
  }

  public static UnsubscribeEntityChanges(entity: AliasEntityType, includePropertyChanges = false) {
    return RealtimeBrowser.__UnsubscribeEntityChanges(entity, undefined, includePropertyChanges);

  }

  public static UnsubscribeEntityPropertyChanges(entity: AliasEntityType, property: string) {
    return RealtimeBrowser.__UnsubscribeEntityChanges(entity, property)
  }


}


function propertyInEntityKeyFn(entity: AliasEntityType, property: string) {
  return `${entity.id}${property}`
}
