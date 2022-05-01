import { _ } from 'tnp-core';
import * as io from 'socket.io';
import { SYMBOL } from '../symbols';
import { Log, Level } from 'ng2-logger';
import { Helpers } from 'tnp-core';
import { BASE_ENTITY } from '../framework/framework-entity';
import { RealtimeBase } from './realtime';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkContext } from '../framework/framework-context';
const log = Log.create('RealtimeNodejs',
  Level.__NOTHING
);

const SOCKET_EVENT_DEBOUNCE = 500;

export class RealtimeNodejs {

  private static jobs = {};

  //#region constructor
  constructor(private context: FrameworkContext) {
    const base = RealtimeBase.by(context);
    if (!context.disabledRealtime) {

      const nspPath = {
        global: base.pathFor(),
        realtime: base.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };

      base.socketNamespace.BE = io(context.node.httpServer, {
        path: nspPath.global.pathname
      });

      const ioGlobalNsp = base.socketNamespace.BE;

      ioGlobalNsp.on('connection', (clientSocket) => {
        log.i(`client conected to namespace "${clientSocket.nsp.name}",  host: ${context.host}`)
      })

      log.i(`CREATE GLOBAL NAMESPACE: '${ioGlobalNsp.path()}' , path: '${nspPath.global.pathname}'`)

      const ioRealtimeNsp = io(context.node.httpServer, {
        path: nspPath.realtime.pathname
      });

      log.i(`CREATE REALTIME NAMESPACE: '${ioRealtimeNsp.path()}' , path: '${nspPath.realtime.pathname}' `)

      base.socketNamespace.BE_REALTIME = ioRealtimeNsp as any;

      ioRealtimeNsp.on('connection', (clientSocket) => {
        log.i(`client conected to namespace "${clientSocket.nsp.name}",  host: ${context.host}`)

        clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
          log.i(`Joining room ${room} in namespace  REALTIME` + ` host: ${context.host}`)
          clientSocket.join(room);
        })

        clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
          log.i(`Joining room ${room} in namespace REALTIME ` + ` host: ${context.host}`)
          clientSocket.join(room);
        })

        clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
          log.i(`Leaving room ${room} in namespace REALTIME ` + ` host: ${context.host}`)
          clientSocket.leave(room);
        })

        clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
          log.i(`Leaving room ${room} in namespace REALTIME ` + ` host: ${context.host}`)
          clientSocket.leave(room);
        })

      })
    }

  }
  //#endregion

  private static __TrigggerEntityChanges(
    context: FrameworkContext,
    entityObjOrClass: BASE_ENTITY<any> | Function,
    property?: string,
    valueOfUniquPropery?: number | string,
    customEvent?: string,
    customEventData?: any,
  ) {

    const base = RealtimeBase.by(context);
    let modelSocketRoomPath: string;
    let eventName: string;

    if (context.disabledRealtime) {
      return;
    }

    if (customEvent) {
      modelSocketRoomPath = SYMBOL.REALTIME.ROOM_NAME.CUSTOM(customEvent);
      eventName = SYMBOL.REALTIME.EVENT.CUSTOM(customEvent);
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

      modelSocketRoomPath = _.isString(property) ?
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(config.className, property, valueOfUniquPropery) :
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(config.className, valueOfUniquPropery);

      eventName = _.isString(property) ?
        SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(config.className, property, valueOfUniquPropery) :
        SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(config.className, valueOfUniquPropery);

    }

    const job = () => {
      base.socketNamespace.BE_REALTIME.in(modelSocketRoomPath).emit(eventName,
        customEventData ? customEventData : ''
      );
    }

    if (!_.isFunction(RealtimeNodejs.jobs[eventName])) {
      RealtimeNodejs.jobs[eventName] = _.debounce(() => {
        job()
      }, SOCKET_EVENT_DEBOUNCE);
    }

    RealtimeNodejs.jobs[eventName]();
  }

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

      Helpers.warn(`[Firedev][TrigggerEntityPropertyChanges][property=${property}] Entity "${className}' is not realtime`);
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

  public triggerCustomEvent(customEvent: string, dataToPush: any) {
    RealtimeNodejs.TrigggerCustomEvent(this.context, customEvent, dataToPush);
  }

  public static TrigggerCustomEvent(context: FrameworkContext, customEvent: string, dataToPush: any) {
    RealtimeNodejs.__TrigggerEntityChanges(context, void 0, void 0, void 0, customEvent, dataToPush);
  }

  public static TrigggerEntityChanges(entityObjOrClass: BASE_ENTITY<any> | Function, idToTrigger?: number | string) {
    const context = FrameworkContext.findForTraget(entityObjOrClass);
    if (context.disabledRealtime) {
      const className = _.isFunction(entityObjOrClass)
        ? CLASS.getName(entityObjOrClass)
        : CLASS.getNameFromObject(entityObjOrClass);

      Helpers.warn(`[Firedev][TrigggerEntityPropertyChanges] Entity "${className}' is not realtime`);
      return;
    }
    RealtimeNodejs.__TrigggerEntityChanges(context, entityObjOrClass as any, void 0, idToTrigger);
  }

}
