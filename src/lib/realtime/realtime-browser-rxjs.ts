import { Level, Log } from "ng2-logger";
import { FrameworkContext } from "../framework/framework-context";
import { SYMBOL } from "../symbols";
import { RealtimeBase } from "./realtime";
import { Helpers, _ } from 'tnp-core';
import * as io from 'socket.io-client';
import { CLASS } from "typescript-class-helpers";
import { Observable, Subscriber } from 'rxjs';
import { RealtimeSubsManager, SubscribtionRealtime } from "./realtime-subs-manager";

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
    // Helpers.log('INITING SOCKETS')
    if (!context.disabledRealtime) {

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };

      log.i('NAMESPACE GLOBAL ', nspPath.global.href + ` host: ${context.host}`)
      log.i('NAMESPACE REALTIME', nspPath.realtime.href + ` host: ${context.host}`)

      const global = io.connect(nspPath.global.origin, {
        path: nspPath.global.pathname
      });

      base.socketNamespace.FE = global as any;

      global.on('connect', () => {
        log.i(`conented to GLOBAL namespace ${global.nsp} of host: ${context.host}`)
      });
      log.i('IT SHOULD CONNECT TO GLOBAL')


      const realtime = io.connect(nspPath.realtime.origin, {
        path: nspPath.realtime.pathname
      }) as any;

      base.socketNamespace.FE_REALTIME = realtime;

      realtime.on('connect', () => {
        log.i(`conented to REALTIME namespace ${realtime.nsp} host: ${context.host}`)
      });

      log.i('IT SHOULD CONNECT TO REALTIME')
    }
    // Helpers.log('INITING SOCKETS DONE')
  }
  //#endregion

  //#region listen changes entity
  static listenChangesEntity(entityClassFn, idOrUniqValue: any, options?: RealtimeBrowserRxjsOptions) {
    options = options || {} as any;

    //#region parameters validation
    const { property, customEvent } = options;
    const className = !customEvent && CLASS.getName(entityClassFn);

    if (_.isString(property)) {
      if (property.trim() === '') {
        throw new Error(`[Firedev][listenChangesEntity.. incorect property '' for ${className}`);
      }
    }
    //#endregion

    return new Observable((observer) => {

      //#region prepare parameters for manager
      const context = options.overrideContext
        ? options.overrideContext
        : FrameworkContext.findForTraget(entityClassFn);

      if (context.disabledRealtime) {
        Helpers.error(`[Firedev][realtime rxjs] remove firedev config flag:

        ...
        disabledRealtime: true
        ...

to use socket realtime connection;
        `)

      } else {
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

        const roomSubOptions: SubscribtionRealtime = {
          context,
          property,
          roomName,
          subPath,
          customEvent,
        };
        //#endregion

        const inst = RealtimeSubsManager.from(roomSubOptions);

        observer.remove(() => {
          inst.remove(observer);
        });

        inst.add(observer);

        inst.startListenIfNotStarted(realtime);
      }

    });
  }

  //#endregion

  //#region listen change entity object
  static listenChangesEntityObj(entity, options?: RealtimeBrowserRxjsOptions) {
    const classFn = CLASS.getFromObject(entity);
    const config = CLASS.getConfig(classFn);
    return RealtimeBrowserRxjs.listenChangesEntity(classFn, entity[config.uniqueKey], options);
  }
  //#endregion

  //#region listen changes custom event
  static listenChangesCustomEvent(context: FrameworkContext, customEvent: string) {
    return RealtimeBrowserRxjs.listenChangesEntity(void 0, void 0, {
      overrideContext: context,
      customEvent,
    });
  }

  listenChangesCustomEvent(customEvent: string) {
    return RealtimeBrowserRxjs.listenChangesCustomEvent(this.context, customEvent);
  }
  //#endregion

}
