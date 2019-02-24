import * as _ from 'lodash';
import * as io from 'socket.io-client';

import { Global } from '../global-config';
import { SYMBOL } from '../symbols';

import { Log, Level } from 'ng2-logger';
import { Helpers } from '../helpers';
import { BASE_ENTITY } from '../framework/framework-entity';
import { CLASS } from 'typescript-class-helpers';
const log = Log.create('RealtimeBrowser', Level.__NOTHING)

export type AliasChangeListenerType = (unsubscribe: () => void) => void;
export type AliasEntityType = Partial<BASE_ENTITY<any>>;

export class RealtimeBrowser {
  init() {
    let uri: URL = Global.vars.urlSocket;
    if (!uri) {
      log.warn(`
        MORPHI: Please use { hostSocket } in morphi init(..)
        function to make socket works
      `)
      return
    }

    const global = io(uri.href, {
      path: uri.pathname !== '/' ? uri.pathname : undefined
    });
    Global.vars.socketNamespace.FE = global as any;

    global.on('connect', () => {
      log.i(`conented to namespace ${global.nsp}`)
    });

    const realtimeNamespaceHref = `${uri.href}${SYMBOL.REALTIME.NAMESPACE}`
    log.i('realtimeNamespaceHref', realtimeNamespaceHref)

    const realtime = io(realtimeNamespaceHref, {
      path: uri.pathname !== '/' ? uri.pathname : undefined
    }) as any;
    Global.vars.socketNamespace.FE_REALTIME = realtime;

    realtime.on('connect', () => {
      log.i(`conented to namespace ${realtime.nsp}`)
    });

  }


  private static realtimeEntityListener: { [className: string]: { [entitiesIds: number]: any[]; } } = {} as any;
  private static realtimeEntityPropertyListener: { [className: string]: { [propertyInEntityIds: string]: any[]; } } = {} as any;

  private static realtimeEntitySockets: { [className: string]: { [entitiesIds: number]: any } } = {} as any;
  private static realtimeEntityPropertySockets: { [className: string]: { [propertyInEntityIds: string]: any } } = {} as any;


  public static __SubscribeEntityChanges(entity: AliasEntityType, changesListener: AliasChangeListenerType, property?: string) {

    const { id } = entity;
    const propertyInEntityKey = `${entity.id}${property}`;

    if (!_.isNumber(id)) {
      console.error(entity)
      throw `[Morphi.Realtime.Browser.Subscribe] bad id = "${id}" for entity.`
    }

    const constructFn = Helpers.Class.getFromObject(entity)

    if (!constructFn) {
      log.er(`Activate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = Helpers.Class.getName(constructFn);

    this.checkObjects(className, entity, property, changesListener);

    const roomName = _.isString(property) ?
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, entity.id) :
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, entity.id)

    const realtime = Global.vars.socketNamespace.FE_REALTIME;
    const ngZone = Global.vars.ngZone;



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
    const propertyInEntityKey = `${entity.id}${property}`;
    if (_.isString(property)) {
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

      const propertyInEntityKey = `${entity.id}${property}`;


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

    const constructFn = _.isFunction(classFN) ? classFN : Helpers.Class.getFromObject(entity)
    if (!constructFn) {
      log.er(`Deactivate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = Helpers.Class.getName(constructFn);

    const roomName = _.isString(property) ?
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, entity.id) :
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, entity.id)


    if (_.isString(property)) {
      const propertyInEntityKey = `${entity.id}${property}`;

      const sub = RealtimeBrowser.realtimeEntityPropertySockets[className] &&
        RealtimeBrowser.realtimeEntityPropertySockets[className][propertyInEntityKey];
      if (!sub) {
        log.w(`No sunscribtion for property in entity: ${propertyInEntityKey}`)
      } else {
        sub.removeAllListeners()
        RealtimeBrowser.realtimeEntityPropertyListener[propertyInEntityKey] = void 0;
      }

      RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey] = void 0;

      const realtime = Global.vars.socketNamespace.FE_REALTIME;
      realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)


    } else {

      const sub = RealtimeBrowser.realtimeEntitySockets[className] &&
        RealtimeBrowser.realtimeEntitySockets[className][entity.id];
      if (!sub) {
        log.w(`No sunscribtion for entity with id ${entity.id}`)
      } else {
        sub.removeAllListeners()
        RealtimeBrowser.realtimeEntitySockets[entity.id] = void 0;
      }

      RealtimeBrowser.realtimeEntityListener[className][entity.id] = void 0;

      const realtime = Global.vars.socketNamespace.FE_REALTIME;
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
