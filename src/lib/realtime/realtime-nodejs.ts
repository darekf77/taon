//#region imports
//#region @backend
import * as ioSocketIo from 'socket.io';
//#endregion
import { _ } from 'tnp-core';
import { SYMBOL } from '../symbols';
import { Log, Level } from 'ng2-logger';
import { Helpers } from 'tnp-core';
import { BASE_ENTITY } from '../framework/framework-entity';
import { RealtimeBase } from './realtime';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkContext } from '../framework/framework-context';
import { mockIoServer } from './broadcast-api-io-mock-server';
//#endregion

//#region consts
const log = Log.create('RealtimeNodejs',
  Level.__NOTHING
);

const SOCKET_EVENT_DEBOUNCE = 500;
//#endregion

export class RealtimeNodejs {

  private static jobs = {};

  //#region constructor
  constructor(private context: FrameworkContext) {
    //#region @websql
    const base = RealtimeBase.by(context);
    if (!context.disabledRealtime) {

      // @ts-ignore;
      let io: (typeof mockIoServer)
        //#region @backend
        = ioSocketIo
      // #endregion

      if (Helpers.isWebSQL) {
        // @ts-ignore
        io = mockIoServer;
      }

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };

      base.BE = io(context.node.httpServer, {
        path: nspPath.global.pathname,
        //#region @browser
        href: nspPath.global.href,
        //#endregion
      });

      const ioGlobalNsp = base.BE;

      ioGlobalNsp.on('connection', (clientSocket) => {
        log.i(`client conected to namespace "${clientSocket.nsp.name}",  host: ${context.host}`)
      })

      log.i(`CREATE GLOBAL NAMESPACE: '${ioGlobalNsp.path()}' , path: '${nspPath.global.pathname}'`)

      const ioRealtimeNsp = io(context.node.httpServer, {
        path: nspPath.realtime.pathname,
        //#region @browser
        href: nspPath.realtime.href,
        //#endregion
      });


      log.i(`CREATE REALTIME NAMESPACE: '${ioRealtimeNsp.path()}' , path: '${nspPath.realtime.pathname}' `)

      base.BE_REALTIME = ioRealtimeNsp as any;

      ioRealtimeNsp.on('connection', (backendSocketForClient) => {
        log.i(`client conected to namespace "${backendSocketForClient.nsp.name}",  host: ${context.host}`)

        backendSocketForClient.on(SYMBOL.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM, roomName => {
          log.i(`Joining room ${roomName} in namespace  REALTIME` + ` host: ${context.host}`)
          backendSocketForClient.join(roomName);
        });

        backendSocketForClient.on(SYMBOL.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName => {
          log.i(`Joining room ${roomName} in namespace  REALTIME` + ` host: ${context.host}`)
          backendSocketForClient.join(roomName);
        });

        backendSocketForClient.on(SYMBOL.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName => {
          log.i(`Joining room ${roomName} in namespace REALTIME ` + ` host: ${context.host}`)
          backendSocketForClient.join(roomName);
        });

        backendSocketForClient.on(SYMBOL.REALTIME.ROOM_NAME.UNSUBSCRIBE.CUSTOM, roomName => {
          log.i(`Leaving room ${roomName} in namespace  REALTIME` + ` host: ${context.host}`)
          backendSocketForClient.leave(roomName);
        });

        backendSocketForClient.on(SYMBOL.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName => {
          log.i(`Leaving room ${roomName} in namespace REALTIME ` + ` host: ${context.host}`)
          backendSocketForClient.leave(roomName);
        });

        backendSocketForClient.on(SYMBOL.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName => {
          log.i(`Leaving room ${roomName} in namespace REALTIME ` + ` host: ${context.host}`)
          backendSocketForClient.leave(roomName);
        });

      })
    }
    //#endregion
  }
  //#endregion

  //#region trigger entity changes

  private static __TrigggerEntityChanges(
    context: FrameworkContext,
    entityObjOrClass: BASE_ENTITY<any> | Function,
    property?: string,
    valueOfUniquPropery?: number | string,
    customEvent?: string,
    customEventData?: any,
  ) {
    log.i('__triger entity changes')
    //#region @websql

    const base = RealtimeBase.by(context);
    let roomName: string;

    if (context.disabledRealtime) {
      return;
    }

    if (customEvent) {
      roomName = SYMBOL.REALTIME.ROOM_NAME.CUSTOM(customEvent);
    } else {

      let entityFn = entityObjOrClass as Function;
      const enittyIsObject = (!_.isFunction(entityObjOrClass) && _.isObject(entityObjOrClass));

      if (enittyIsObject) {
        entityFn = CLASS.getBy(CLASS.getNameFromObject(entityObjOrClass)) as any;
      }
      const config = CLASS.getConfig(entityFn);
      const uniqueKey = config.uniqueKey;

      if (enittyIsObject) {
        valueOfUniquPropery = entityObjOrClass[uniqueKey];
      }

      if (!valueOfUniquPropery) {
        Helpers.error(`[Firedev][Realtime] Entity without iD ! ${config.className} `, true, true);
        return;
      }

      roomName = _.isString(property) ?
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(config.className, property, valueOfUniquPropery) :
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(config.className, valueOfUniquPropery);

    }

    const job = () => {
      // console.log(`Trigger realtime: ${roomName}`)
      base.BE_REALTIME.in(roomName).emit(roomName, // roomName == eventName in room na
        customEventData ? customEventData : ''
      );
    }

    if (!_.isFunction(RealtimeNodejs.jobs[roomName])) {
      RealtimeNodejs.jobs[roomName] = _.debounce(() => {
        job()
      }, SOCKET_EVENT_DEBOUNCE);
    }

    RealtimeNodejs.jobs[roomName]();
    //#endregion
  }

  public static TrigggerEntityChanges(entityObjOrClass: BASE_ENTITY<any> | Function, idToTrigger?: number | string) {
    const context = FrameworkContext.findForTraget(entityObjOrClass);
    if (context.disabledRealtime) {
      const className = _.isFunction(entityObjOrClass)
        ? CLASS.getName(entityObjOrClass)
        : CLASS.getNameFromObject(entityObjOrClass);

      console.warn(`[Firedev][TrigggerEntityChanges] Entity "${className}' is not realtime`);
      return;
    }
    RealtimeNodejs.__TrigggerEntityChanges(context, entityObjOrClass as any, void 0, idToTrigger);
  }
  //#endregion

  //#region trigger entity property changes
  public static TrigggerEntityPropertyChanges<ENTITY = any>(
    entityObjOrClass: BASE_ENTITY<any> | Function,
    property: (keyof ENTITY) | (keyof ENTITY)[],
    idToTrigger?: number | string,
  ) {
    const context = FrameworkContext.findForTraget(entityObjOrClass);
    if (context.disabledRealtime) {
      const className = _.isFunction(entityObjOrClass)
        ? CLASS.getName(entityObjOrClass)
        : CLASS.getNameFromObject(entityObjOrClass);

      // @ts-ignore
      console.warn(`[Firedev][TrigggerEntityPropertyChanges][property=${property}] Entity "${className}' is not realtime`);
      return;
    }

    if (_.isArray(property)) {
      property.forEach(propertyFromArr => {
        RealtimeNodejs.__TrigggerEntityChanges(context, entityObjOrClass, propertyFromArr as any, idToTrigger)
      })
    } else {
      RealtimeNodejs.__TrigggerEntityChanges(context, entityObjOrClass, property as any, idToTrigger)
    };
  }
  //#endregion

  //#region trigger custom event
  public triggerCustomEvent(customEvent: string, dataToPush: any) {
    RealtimeNodejs.TrigggerCustomEvent(this.context, customEvent, dataToPush);
  }

  public static TrigggerCustomEvent(context: FrameworkContext, customEvent: string, dataToPush: any) {
    RealtimeNodejs.__TrigggerEntityChanges(context, void 0, void 0, void 0, customEvent, dataToPush);
  }
  //#endregion

  //#region trigger entity table changes
  public static TrigggerEntityTableChanges(entityClass: Function) {

    const context = FrameworkContext.findForTraget(entityClass);
    const className = CLASS.getName(entityClass)
    if (context.disabledRealtime) {
      console.warn(`[Firedev][TrigggerEntityTableChanges] Entity "${className}' is not realtime`);
      return;
    }

    RealtimeNodejs.__TrigggerEntityChanges(
      context,
      entityClass as any,
      void 0, void 0,
      SYMBOL.REALTIME.TABLE_CHANGE(className),
    );
  }

  public TrigggerEntityTableChanges(entityClass: Function) {
    RealtimeNodejs.TrigggerEntityTableChanges(entityClass);
  }


  //#endregion

}
//#endregion
