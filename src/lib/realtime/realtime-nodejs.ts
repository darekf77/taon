//#region imports
//#region @backend
import * as ioSocketIo from 'socket.io';
//#endregion
import { _ } from 'tnp-core/src';
import { Symbols } from '../symbols';
import { Log, Level } from 'ng2-logger/src';
import { Helpers } from 'tnp-core/src';
import { RealtimeBase } from './realtime';
import { mockIoServer } from './broadcast-api-io-mock-server';
import { EndpointContext } from '../endpoint-context';
import { ClassHelpers } from '../helpers/class-helpers';
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
  constructor(private context: EndpointContext) {
    //#region @websql
    const base = RealtimeBase.by(context);
    // if (Helpers.isElectron) {
    //   return;
    // }
    if (!context.disabledRealtime) {

      let io: (typeof mockIoServer)
        //#region @backend
        = ioSocketIo
      // #endregion

      if (Helpers.isWebSQL) {
        io = mockIoServer;
      }

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(Symbols.old.REALTIME.NAMESPACE)
      };

      base.BE = io(context.serverTcpUdp, {
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

      const ioRealtimeNsp = io(context.serverTcpUdp, {
        path: nspPath.realtime.pathname,
        //#region @browser
        href: nspPath.realtime.href,
        //#endregion
      });


      log.i(`CREATE REALTIME NAMESPACE: '${ioRealtimeNsp.path()}' , path: '${nspPath.realtime.pathname}' `)

      base.BE_REALTIME = ioRealtimeNsp as any;

      ioRealtimeNsp.on('connection', (backendSocketForClient) => {
        log.i(`client conected to namespace "${backendSocketForClient.nsp.name}",  host: ${context.host}`)

        backendSocketForClient.on(Symbols.old.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM, roomName => {
          log.i(`Joining room ${roomName} in namespace  REALTIME` + ` host: ${context.host}`)
          backendSocketForClient.join(roomName);
        });

        backendSocketForClient.on(Symbols.old.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName => {
          log.i(`Joining room ${roomName} in namespace  REALTIME` + ` host: ${context.host}`)
          backendSocketForClient.join(roomName);
        });

        backendSocketForClient.on(Symbols.old.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName => {
          log.i(`Joining room ${roomName} in namespace REALTIME ` + ` host: ${context.host}`)
          backendSocketForClient.join(roomName);
        });

        backendSocketForClient.on(Symbols.old.REALTIME.ROOM_NAME.UNSUBSCRIBE.CUSTOM, roomName => {
          log.i(`Leaving room ${roomName} in namespace  REALTIME` + ` host: ${context.host}`)
          backendSocketForClient.leave(roomName);
        });

        backendSocketForClient.on(Symbols.old.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName => {
          log.i(`Leaving room ${roomName} in namespace REALTIME ` + ` host: ${context.host}`)
          backendSocketForClient.leave(roomName);
        });

        backendSocketForClient.on(Symbols.old.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName => {
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
    context: EndpointContext,
    entityObjOrClass: Function,
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
      roomName = Symbols.old.REALTIME.ROOM_NAME.CUSTOM(customEvent);
    } else {

      let entityFn = entityObjOrClass as Function;
      const enittyIsObject = (!_.isFunction(entityObjOrClass) && _.isObject(entityObjOrClass));

      if (enittyIsObject) {
        entityFn = ClassHelpers.getClassFnFromObject(entityObjOrClass);
      }

      const uniqueKey = ClassHelpers.getUniquKey(entityFn);

      if (enittyIsObject) {
        valueOfUniquPropery = entityObjOrClass[uniqueKey];
      }

      if (!valueOfUniquPropery) {
        Helpers.error(`[Firedev][Realtime] Entity without iD ! ${ClassHelpers.getName(entityFn)} `, true, true);
        return;
      }

      roomName = _.isString(property) ?
        Symbols.old.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(ClassHelpers.getName(entityFn), property, valueOfUniquPropery) :
        Symbols.old.REALTIME.ROOM_NAME.UPDATE_ENTITY(ClassHelpers.getName(entityFn), valueOfUniquPropery);

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

  public static TrigggerEntityChanges(entityObjOrClass: Function, idToTrigger?: number | string) {
    const context = EndpointContext.findForTraget(entityObjOrClass);
    if (context.disabledRealtime) {
      const className = ClassHelpers.getName(entityObjOrClass);

      console.warn(`[Firedev][TrigggerEntityChanges] Entity "${className}' is not realtime`);
      return;
    }
    RealtimeNodejs.__TrigggerEntityChanges(context, entityObjOrClass as any, void 0, idToTrigger);
  }
  //#endregion

  //#region trigger entity property changes
  public static TrigggerEntityPropertyChanges<ENTITY = any>(
    entityObjOrClass: Function,
    property: (keyof ENTITY) | (keyof ENTITY)[],
    idToTrigger?: number | string,
  ) {
    const context = EndpointContext.findForTraget(entityObjOrClass);
    if (context.disabledRealtime) {
      const className = ClassHelpers.getName(entityObjOrClass);

      console.warn(`[Firedev][TrigggerEntityPropertyChanges][property=${property as string}] Entity "${className}' is not realtime`);
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

  public static TrigggerCustomEvent(context: EndpointContext, customEvent: string, dataToPush: any) {
    RealtimeNodejs.__TrigggerEntityChanges(context, void 0, void 0, void 0, customEvent, dataToPush);
  }
  //#endregion

  //#region trigger entity table changes
  public static TrigggerEntityTableChanges(entityClass: Function) {

    const context = EndpointContext.findForTraget(entityClass);
    const className = ClassHelpers.getName(entityClass);
    if (context.disabledRealtime) {
      console.warn(`[Firedev][TrigggerEntityTableChanges] Entity "${className}' is not realtime`);
      return;
    }

    RealtimeNodejs.__TrigggerEntityChanges(
      context,
      entityClass as any,
      void 0, void 0,
      Symbols.old.REALTIME.TABLE_CHANGE(className),
    );
  }

  public TrigggerEntityTableChanges(entityClass: Function) {
    RealtimeNodejs.TrigggerEntityTableChanges(entityClass);
  }


  //#endregion

}
//#endregion
