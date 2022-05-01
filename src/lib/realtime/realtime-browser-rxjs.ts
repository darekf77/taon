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

export type RealtimeBrowserRxjsOptions = { property?: string };

export class RealtimeBrowserRxjs {


  //#region constructor
  constructor(context: FrameworkContext) {
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
    const { property } = options || {};
    const className = CLASS.getName(entityClassFn);
    if (_.isString(property)) {
      if (property.trim() === '') {
        throw new Error(`[Firedev][listenChangesEntity.. incorect property '' for ${className}`);
      }
    }
    const context = FrameworkContext.findForTraget(entityClassFn);
    return new Observable((observer) => {


      const ngZone = context.ngZone;
      const base = RealtimeBase.by(context);
      const realtime = base.socketNamespace.FE_REALTIME;
      const subPath = _.isString(property)
        ? SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(
          className,
          property,
          idOrUniqValue
        )
        : SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(
          className,
          idOrUniqValue
        );

      const roomName = _.isString(property) ?
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, idOrUniqValue) :
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, idOrUniqValue)

      if (_.isString(property)) {
        realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
        log.i('[Firedev] SUBSCRIBE TO ' + subPath + ` for host: ${context.host}`)
      } else {
        realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
        log.i('[Firedev] SUBSCRIBE TO ' + subPath + ` for host: ${context.host}`)
      }

      observer.add(() => {
        if (_.isString(property)) {
          realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
        } else {
          realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
        }
      });

      realtime.on(subPath, (data) => {
        if (ngZone) {
          ngZone.run(() => {
            observer.next(data);
          })
        } else {
          observer.next(data);
        }
      });

    });
  }

  static listenChangesEntityObj(entity, options?: RealtimeBrowserRxjsOptions) {
    const classFn = CLASS.getFromObject(entity);
    const config = CLASS.getConfig(classFn);
    return this.listenChangesEntity(classFn, entity[config.uniqueKey], options);
  }


}
