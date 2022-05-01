//#region imports
import { _ } from 'tnp-core';
import * as io from 'socket.io-client';
import { SYMBOL } from '../symbols';
import { Log, Level } from 'ng2-logger';
import { BASE_ENTITY } from '../framework/framework-entity';
import { CLASS } from 'typescript-class-helpers';
import { RealtimeBase } from './realtime';
import { FrameworkContext } from '../framework/framework-context';
//#endregion

const log = Log.create('RealtimeBrowser',
  // Level.__NOTHING
);

//#region types
export type AliasChangeListenerType = (unsubscribe: () => void) => void;
export type AliasEntityType = Partial<BASE_ENTITY<any>>;
//#endregion

export class RealtimeBrowser extends RealtimeBase {

  //#region static fields
  private static realtimeEntityListener: { [className: string]: { [entitiesIds: number]: any[]; } } = {} as any;
  private static realtimeEntityPropertyListener: { [className: string]: { [propertyInEntityIds: string]: any[]; } } = {} as any;

  private static realtimeEntitySockets: { [className: string]: { [entitiesIds: number]: any } } = {} as any;
  private static realtimeEntityPropertySockets: { [className: string]: { [propertyInEntityIds: string]: any } } = {} as any;
  //#endregion

  //#region constructor
  constructor(context: FrameworkContext) {
    super(context);
    if (!context.disabledRealtime) {


      const nspPath = {
        global: this.pathFor(),
        realtime: this.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };

      log.i('NAMESPACE GLOBAL ', nspPath.global.href + ` host: ${this.context.host}`)
      log.i('NAMESPACE REALTIME', nspPath.realtime.href + ` host: ${this.context.host}`)

      const global = io(nspPath.global.origin, {
        path: nspPath.global.pathname
      });
      this.socketNamespace.FE = global as any;

      global.on('connect', () => {
        log.i(`conented to GLOBAL namespace ${global.nsp} of host: ${this.context.host}`)
      });
      log.i('IT SHOULD CONNECT TO GLOBAL')


      const realtime = io(nspPath.realtime.origin, {
        path: nspPath.realtime.pathname
      }) as any;

      this.socketNamespace.FE_REALTIME = realtime;

      realtime.on('connect', () => {
        log.i(`conented to REALTIME namespace ${realtime.nsp} host: ${this.context.host}`)
      });

      log.i('IT SHOULD CONNECT TO REALTIME')
    }
  }
  //#endregion

  //#region public api

  //#region public api / trigger change to entity
  public static TriggerChange(entity: AliasEntityType, property?: string) {
    const context = FrameworkContext.findForTraget(entity);
    return context.browser.realtime?.TriggerChange(entity, property);
  }

  public TriggerChange(entity: AliasEntityType, property?: string) {
    if (this.context.disabledRealtime) {
      return;
    }
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
  //#endregion

  //#region public api / add duplicate realtime entity listener
  /**
   * TODO why do I need this ?
   */
  public static addDupicateRealtimeEntityListener(entity: AliasEntityType, changesListener: AliasChangeListenerType, property?: string) {
    const context = FrameworkContext.findForTraget(entity);
    return context.browser.realtime?.addDupicateRealtimeEntityListener(entity, changesListener, property);
  }

  public addDupicateRealtimeEntityListener(entity: AliasEntityType, changesListener: AliasChangeListenerType, property?: string) {
    if (this.context.disabledRealtime) {
      return;
    }
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
  //#endregion

  //#region public api / subscribe entity changes

  private __SubscribeEntityChanges(entity: AliasEntityType, changesListener: AliasChangeListenerType, property?: string) {
    if (this.context.disabledRealtime) {
      return;
    }
    const { id } = entity;
    const propertyInEntityKey = propertyInEntityKeyFn(entity, property);

    this.entityIdIsCorrect(id, entity, 'Subscribe');

    const constructFn = CLASS.getFromObject(entity)

    if (!constructFn) {
      log.er(`Activate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = CLASS.getName(constructFn);

    this.checkObjects(className, entity, property, changesListener);
    if (property) {
      log.d(`subsceibe entity property changes: "${className}/${property}"`)
    } else {
      log.d(`subsceibe entity changes: "${className}"`)
    }

    log.d(`[Firedev][className][after check object] ${className} host: ${this.context.host} `)

    const roomName = _.isString(property) ?
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, entity.id) :
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, entity.id)


    log.d(`[Firedev][className][roomName] ${roomName} host: ${this.context.host} `)
    const realtime = this.socketNamespace.FE_REALTIME;
    const ngZone = this.context.ngZone;



    // realtime.on('connect', () => {
    //   console.log(`conented to namespace ${realtime.nsp && realtime.nsp.name}`)
    if (_.isString(property)) {
      realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
      log.i('[Firedev] SUBSCRIBE TO ' +
        SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, entity.id)
        + ` for host: ${this.context.host}`)
    } else {
      realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
      log.i('[Firedev] SUBSCRIBE TO ' +
        SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, entity.id)
        + ` for host: ${this.context.host}`)
    }

    const callBackDebouced = () => {
      if (_.isFunction(changesListener)) {
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
            log.d(`changeListenerFromArray length: ${arr.length} , for ${className}/${propertyInEntityKey}`)
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
    }

    const cb = _.debounce(() => {
      callBackDebouced();
    });

    const callbackForRealtimeChanges = (
      data // NO need to know data
    ) => {

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
      sub = realtime.on(SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, entity.id), callbackForRealtimeChanges)
      RealtimeBrowser.realtimeEntityPropertySockets[className][propertyInEntityKey] = sub;
      RealtimeBrowser.realtimeEntityPropertyListener[className][propertyInEntityKey].push(changesListener);
    } else {
      sub = realtime.on(SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, entity.id), callbackForRealtimeChanges)
      RealtimeBrowser.realtimeEntitySockets[className][entity.id] = sub;
      RealtimeBrowser.realtimeEntityListener[className][entity.id].push(changesListener);
    }
  }

  static SubscribeEntity<T = { [prop: string]: string; }>(
    entityFn: Function,
    valueOfUniqueIdProperty: any,
    changesListener: AliasChangeListenerType,
    property?: (keyof T) | string,
  ) {
    const entity = new (entityFn as any)();
    const indexProp = CLASS.OBJECT(entity).indexProperty;
    entity[indexProp] = valueOfUniqueIdProperty;
    const context = FrameworkContext.findForTraget(entity);
    if (property) {
      return context.browser.realtime.SubscribeEntityPropertyChanges(entity, property as any, changesListener);
    } else {
      return context.browser.realtime.SubscribeEntityChanges(entity, changesListener);
    }
  }

  static SubscribeEntityChanges(entity: AliasEntityType, changesListener: AliasChangeListenerType) {
    const context = FrameworkContext.findForTraget(entity);
    return context.browser.realtime.SubscribeEntityChanges(entity, changesListener);
  }
  public SubscribeEntityChanges(entity: AliasEntityType, changesListener: AliasChangeListenerType) {
    if (this.context.disabledRealtime) {
      return;
    }
    return this.__SubscribeEntityChanges(entity, changesListener);
  }

  public static SubscribeEntityPropertyChanges(entity: AliasEntityType, property: string, changesListener: AliasChangeListenerType) {
    const context = FrameworkContext.findForTraget(entity);
    return context.browser.realtime.SubscribeEntityPropertyChanges(entity, property, changesListener);
  }
  public SubscribeEntityPropertyChanges(entity: AliasEntityType, property: string, changesListener: AliasChangeListenerType) {
    if (this.context.disabledRealtime) {
      return;
    }
    return this.__SubscribeEntityChanges(entity, changesListener, property);
  }
  //#endregion

  //#region public api / unsubscribe entity changes
  private __UnsubscribeEntityChanges(entity: AliasEntityType, property?: string, includePropertyChanges = false, classFN?: Function) {
    if (this.context.disabledRealtime) {
      return;
    }
    if (includePropertyChanges) {
      CLASS.describeProperites(CLASS.getFromObject(entity)).forEach(property => {
        this.UnsubscribeEntityPropertyChanges(entity, property)
      })
    }

    const { id } = entity;
    this.entityIdIsCorrect(id, entity, 'Unsubscribe');

    const constructFn = _.isFunction(classFN) ? classFN : CLASS.getFromObject(entity)
    if (!constructFn) {
      log.er(`Deactivate: Cannot retrive Class function from object`, entity)
      return
    }

    const className = CLASS.getName(constructFn);
    const realtime = this.socketNamespace.FE_REALTIME;

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
    const contexts = (FrameworkContext.contexts)
      .filter(c => !c.disabledRealtime)
    for (let index = 0; index < contexts.length; index++) {
      const c = contexts[index];
      c.browser?.realtime?.UnsubscribeEverything();
    }
  }

  public UnsubscribeEverything() {
    if (this.context.disabledRealtime) {
      return;
    }
    Object.keys(RealtimeBrowser.realtimeEntitySockets).forEach(className => {
      Object.keys(RealtimeBrowser.realtimeEntitySockets[className]).forEach(entityId => {
        this.__UnsubscribeEntityChanges({ id: entityId } as any, undefined, true, CLASS.getBy(className));
      })
    });
  }

  public static UnsubscribeEntityChanges(entity: AliasEntityType, includePropertyChanges = false) {
    const context = FrameworkContext.findForTraget(entity);
    return context.browser?.realtime?.UnsubscribeEntityChanges(entity, includePropertyChanges);
  }

  public UnsubscribeEntityChanges(entity: AliasEntityType, includePropertyChanges = false) {
    if (this.context.disabledRealtime) {
      return;
    }
    return this.__UnsubscribeEntityChanges(entity, undefined, includePropertyChanges);
  }

  public static UnsubscribeEntityPropertyChanges(entity: AliasEntityType, property: string) {
    const context = FrameworkContext.findForTraget(entity);
    return context.browser?.realtime?.UnsubscribeEntityPropertyChanges(entity, property);
  }

  public UnsubscribeEntityPropertyChanges(entity: AliasEntityType, property: string) {
    if (this.context.disabledRealtime) {
      return;
    }
    return this.__UnsubscribeEntityChanges(entity, property)
  }
  //#endregion

  //#endregion

  //#region private methods

  //#region private methods / is entity id ok
  private entityIdIsCorrect(id: string | number, entity: any,
    action: 'Subscribe' | 'Unsubscribe') {
    if (!(_.isNumber(id) || _.isString(id))) {
      if (_.isFunction(entity)) {
        entity = CLASS.getName(entity)
      }
      if (_.isObject(entity)) {
        entity = CLASS.getNameFromObject(entity)
      }

      throw `[Firedev.Realtime.Browser.${action}] bad id "${id}" for entity "${entity}" `
      + `. Should be number or string`;
    }
  }
  //#endregion

  //#region private methods / check objects
  private checkObjects(className: string, entity: Partial<BASE_ENTITY<any>>, property: string, changesListener) {
    if (this.context.disabledRealtime) {
      return;
    }
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
  //#endregion

  //#endregion

}

//#region helpers

function propertyInEntityKeyFn(entity: AliasEntityType, property: string) {
  return `${entity.id}${property}`
}
//#endregion
