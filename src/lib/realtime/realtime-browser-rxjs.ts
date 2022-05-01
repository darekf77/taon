import { Level, Log } from "ng2-logger";
import { FrameworkContext } from "../framework/framework-context";
import { SYMBOL } from "../symbols";
import { RealtimeBase } from "./realtime";
import { _ } from 'tnp-core';
import * as io from 'socket.io-client';
import { CLASS } from "typescript-class-helpers";
import { Observable } from "rxjs";

const log = Log.create('REALTIME RXJS',
  Level.__NOTHING
);

export type RealtimeBrowserRxjsOptions = {
  property?: string
  overrideContext?: FrameworkContext;
  customEvent?: string;
};

export class RealtimeBrowserRxjs {


  //#region constructor
  constructor(private context: FrameworkContext) {
    const base = RealtimeBase.by(context);
    if (!context.disabledRealtime) {

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };

      log.i('NAMESPACE GLOBAL ', nspPath.global.href + ` host: ${context.host}`)
      log.i('NAMESPACE REALTIME', nspPath.realtime.href + ` host: ${context.host}`)

      const global = io(nspPath.global.origin, {
        path: nspPath.global.pathname
      });
      base.socketNamespace.FE = global as any;

      global.on('connect', () => {
        log.i(`conented to GLOBAL namespace ${global.nsp} of host: ${context.host}`)
      });
      log.i('IT SHOULD CONNECT TO GLOBAL')


      const realtime = io(nspPath.realtime.origin, {
        path: nspPath.realtime.pathname
      }) as any;

      base.socketNamespace.FE_REALTIME = realtime;

      realtime.on('connect', () => {
        log.i(`conented to REALTIME namespace ${realtime.nsp} host: ${context.host}`)
      });

      log.i('IT SHOULD CONNECT TO REALTIME')
    }
  }
  //#endregion

  static listenChangesEntity(entityClassFn, idOrUniqValue: any, options?: RealtimeBrowserRxjsOptions) {
    options = options || {} as any;
    const { property, customEvent } = options;
    const className = !customEvent && CLASS.getName(entityClassFn);

    if (_.isString(property)) {
      if (property.trim() === '') {
        throw new Error(`[Firedev][listenChangesEntity.. incorect property '' for ${className}`);
      }
    }
    const context = options.overrideContext
      ? options.overrideContext
      : FrameworkContext.findForTraget(entityClassFn);

    return new Observable((observer) => {

      const ngZone = context.ngZone;
      const base = RealtimeBase.by(context);
      const realtime = base.socketNamespace.FE_REALTIME;
      let subPath: string;
      let roomName: string;

      if (customEvent) {
        roomName = SYMBOL.REALTIME.ROOM_NAME.CUSTOM(customEvent);
        subPath = SYMBOL.REALTIME.EVENT.CUSTOM(customEvent);
      } else {
        subPath = _.isString(property)
          ? SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(
            className,
            property,
            idOrUniqValue
          )
          : SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(
            className,
            idOrUniqValue
          );

        roomName = _.isString(property) ?
          SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, idOrUniqValue) :
          SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, idOrUniqValue);
      }

      if (customEvent) {
        realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.CUSTOM, roomName);
      } else {
        if (_.isString(property)) {
          realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName);
        } else {
          realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName);
        }
      }

      observer.remove(() => {
        if (customEvent) {
          realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.CUSTOM, roomName)
        } else {
          if (_.isString(property)) {
            realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
          } else {
            realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
          }
        }
      });

      realtime.on(subPath, (data) => {
        if (!observer.closed) {
          if (ngZone) {
            ngZone.run(() => {
              observer.next(data);
            })
          } else {
            observer.next(data);
          }
        }
      });

    });
  }

  static listenChangesEntityObj(entity, options?: RealtimeBrowserRxjsOptions) {
    const classFn = CLASS.getFromObject(entity);
    const config = CLASS.getConfig(classFn);
    return RealtimeBrowserRxjs.listenChangesEntity(classFn, entity[config.uniqueKey], options);
  }

  static listenChangesCustomEvent(context: FrameworkContext, customEvent: string) {
    return RealtimeBrowserRxjs.listenChangesEntity(void 0, void 0, {
      overrideContext: context,
      customEvent,
    });
  }

  listenChangesCustomEvent(customEvent: string) {
    return RealtimeBrowserRxjs.listenChangesCustomEvent(this.context, customEvent);
  }


}
