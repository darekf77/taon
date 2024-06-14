import { Level, Log } from 'ng2-logger/src';
import { RealtimeBase } from './realtime';
import { Helpers, _ } from 'tnp-core/src';
import * as ioClientIo from 'socket.io-client';
import { Symbols } from '../symbols';
import { Observable, Subscriber } from 'rxjs';
import {
  RealtimeSubsManager,
  SubscribtionRealtime,
} from './realtime-subs-manager';
import { EndpointContext } from '../endpoint-context';
import { ClassHelpers } from '../helpers/class-helpers';
//#region @websql
import { mockIoClient } from './broadcast-api-io-mock-client';
//#endregion

const log = Log.create('REALTIME RXJS', Level.__NOTHING);

export type RealtimeBrowserRxjsOptions = {
  property?: string;
  overrideContext?: EndpointContext;
  customEvent?: string;
};

export class RealtimeBrowserRxjs {
  //#region constructor
  constructor(public context: EndpointContext) {
    const base = RealtimeBase.by(context);
    // if (Helpers.isElectron) {
    //   return;
    // }
    // Helpers.log('INITING SOCKETS')
    if (!context.disabledRealtime) {
      let io: any = ioClientIo?.default //typeof mockIoClient
        ? ioClientIo.default
        : ioClientIo;

      if (Helpers.isWebSQL) {
        //#region @websql
        io = mockIoClient as any;
        //#endregion
      }

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(Symbols.old.REALTIME.NAMESPACE),
      };

      log.i(
        '[CLIENT] NAMESPACE GLOBAL ',
        nspPath.global.href + ` host: ${context.host}`,
      );
      log.i(
        '[CLIENT] NAMESPACE REALTIME',
        nspPath.realtime.href + ` host: ${context.host}`,
      );

      const global = io.connect(nspPath.global.origin, {
        path: nspPath.global.pathname,
      });

      base.FE = global as any;

      global.on('connect', () => {
        log.i(
          `[CLIENT] conented to GLOBAL namespace ${global.nsp} of host: ${context.host}`,
        );
      });
      // log.i('[CLIENT] IT SHOULD CONNECT TO GLOBAL')

      const realtime = io.connect(nspPath.realtime.origin, {
        path: nspPath.realtime.pathname,
      }) as any;

      base.FE_REALTIME = realtime;

      realtime.on('connect', () => {
        log.i(
          `[CLIENT] conented to REALTIME namespace ${realtime.nsp} host: ${context.host}`,
        );
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
  static listenChangesEntity(
    entityClassFn,
    idOrUniqValue: any,
    options?: RealtimeBrowserRxjsOptions,
  ) {
    options = options || ({} as any);

    //#region parameters validation
    const { property, customEvent } = options;
    const className = !customEvent && ClassHelpers.getName(entityClassFn);

    if (_.isString(property)) {
      if (property.trim() === '') {
        throw new Error(
          `[Firedev][listenChangesEntity.. incorect property '' for ${className}`,
        );
      }
    }
    //#endregion

    return new Observable(observer => {
      //#region prepare parameters for manager
      const context = options.overrideContext
        ? options.overrideContext
        : EndpointContext.findForTraget(entityClassFn);

      if (context.disabledRealtime) {
        Helpers.error(`[Firedev][realtime rxjs] remove firedev config flag:

        ...
        disabledRealtime: true
        ...

to use socket realtime connection;
        `);
        return () => {
          // empty nothing to do
        };
      }
      const base = RealtimeBase.by(context);
      const realtime = base.FE_REALTIME;
      let roomName: string;

      if (customEvent) {
        roomName = Symbols.old.REALTIME.ROOM_NAME.CUSTOM(customEvent);
      } else {
        roomName = _.isString(property)
          ? Symbols.old.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(
              className,
              property,
              idOrUniqValue,
            )
          : Symbols.old.REALTIME.ROOM_NAME.UPDATE_ENTITY(
              className,
              idOrUniqValue,
            );
      }

      const roomSubOptions: SubscribtionRealtime = {
        context,
        property,
        roomName,
        customEvent,
      };
      //#endregion

      const inst = RealtimeSubsManager.from(roomSubOptions);
      inst.add(observer);

      inst.startListenIfNotStarted(realtime);

      return () => {
        inst.remove(observer);
      };
    });
  }

  //#endregion

  //#region listen changes entity table
  static listenChangesEntityTable(entityClassFn: Function) {
    const className = ClassHelpers.getName(entityClassFn);
    return RealtimeBrowserRxjs.listenChangesEntity(entityClassFn, void 0, {
      customEvent: Symbols.old.REALTIME.TABLE_CHANGE(className),
    });
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
    const classFn = ClassHelpers.getClassFnFromObject(entity);
    const uniqueKey = ClassHelpers.getUniquKey(classFn);
    return RealtimeBrowserRxjs.listenChangesEntity(
      classFn,
      entity[uniqueKey],
      options,
    );
  }
  //#endregion

  //#region listen changes custom event
  static listenChangesCustomEvent(
    context: EndpointContext,
    customEvent: string,
  ) {
    return RealtimeBrowserRxjs.listenChangesEntity(void 0, void 0, {
      overrideContext: context,
      customEvent,
    });
  }

  listenChangesCustomEvent(customEvent: string) {
    return RealtimeBrowserRxjs.listenChangesCustomEvent(
      this.context,
      customEvent,
    );
  }
  //#endregion
}
