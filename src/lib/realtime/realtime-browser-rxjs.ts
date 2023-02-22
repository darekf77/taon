import { Level, Log } from "ng2-logger";
import { FrameworkContext } from "../framework/framework-context";
import { SYMBOL } from "../symbols";
import { RealtimeBase } from "./realtime";
import { Helpers, _ } from 'tnp-core';
import * as ioClientIo from 'socket.io-client';
import { CLASS } from "typescript-class-helpers";
import { Observable, Subscriber } from 'rxjs';
import { RealtimeSubsManager, SubscribtionRealtime } from "./realtime-subs-manager";
//#region @websql
import { mockIoClient } from "./broadcast-api-io-mock-client";
//#endregion

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

      let io
        //#region @websql
        : typeof mockIoClient
        //#endregion
        = ioClientIo?.default ? ioClientIo.default : ioClientIo;

      if (Helpers.isWebSQL) {
        // @ts-ignore
        io = mockIoClient;
      }

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };

      log.i('[CLIENT] NAMESPACE GLOBAL ', nspPath.global.href + ` host: ${context.host}`)
      log.i('[CLIENT] NAMESPACE REALTIME', nspPath.realtime.href + ` host: ${context.host}`)

      const global = io.connect(nspPath.global.origin, {
        path: nspPath.global.pathname
      });

      base.FE = global as any;

      global.on('connect', () => {
        log.i(`[CLIENT] conented to GLOBAL namespace ${global.nsp} of host: ${context.host}`)
      });
      // log.i('[CLIENT] IT SHOULD CONNECT TO GLOBAL')


      const realtime = io.connect(nspPath.realtime.origin, {
        path: nspPath.realtime.pathname
      }) as any;

      base.FE_REALTIME = realtime;

      realtime.on('connect', () => {
        log.i(`[CLIENT] conented to REALTIME namespace ${realtime.nsp} host: ${context.host}`)
      });

      // log.i('IT SHOULD CONNECT TO REALTIME')
    }
    // Helpers.log('INITING SOCKETS DONE')


  }
  //#endregion

  //#region listen changes entity
  /**
   * Changes trigger on backend needs to be done manually.. example code:
   *
   * ...
   * Firedev.Realtime.Server.TrigggerEntityChanges(myEntityInstance);
   * ...
   */
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
        const realtime = base.FE_REALTIME;
        let roomName: string;

        if (customEvent) {
          roomName = SYMBOL.REALTIME.ROOM_NAME.CUSTOM(customEvent);
        } else {
          roomName = _.isString(property) ?
            SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, idOrUniqValue) :
            SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, idOrUniqValue);
        }

        const roomSubOptions: SubscribtionRealtime = {
          context,
          property,
          roomName,
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

  //#region listen changes entity table
  static listenChangesEntityTable(entityClassFn: Function) {
    const className = CLASS.getName(entityClassFn);
    return RealtimeBrowserRxjs.listenChangesEntity(entityClassFn, void 0, {
      customEvent: SYMBOL.REALTIME.TABLE_CHANGE(className),
    })
  }

  //#endregion

  //#region listen change entity object
  /**
  * Changes trigger on backend needs to be done manually.. example code:
  *
  * ...
  * Firedev.Realtime.Server.TrigggerEntityChanges(myEntityInstance);
  * // or
  * Firedev.Realtime.Server.TrigggerEntityPropertyChanges(myEntityInstance,{ property: 'geolocationX' });
  * ...
  */
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
