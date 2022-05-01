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

export class RealtimeNodejs {
  readonly base: RealtimeBase;
  private static jobs = {};

  //#region constructor
  constructor(private context: FrameworkContext) {
    this.base = RealtimeBase.by(context);
    if (!context.disabledRealtime) {

      const nspPath = {
        global: this.base.pathFor(),
        realtime: this.base.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };


      this.base.socketNamespace.BE = io(context.node.httpServer, {
        path: nspPath.global.pathname
      });


      const ioGlobalNsp = this.base.socketNamespace.BE;

      ioGlobalNsp.on('connection', (clientSocket) => {
        log.i(`client conected to namespace "${clientSocket.nsp.name}",  host: ${context.host}`)
      })

      log.i(`CREATE GLOBAL NAMESPACE: '${ioGlobalNsp.path()}' , path: '${nspPath.global.pathname}'`)

      const ioRealtimeNsp = io(context.node.httpServer, {
        path: nspPath.realtime.pathname
      });

      log.i(`CREATE REALTIME NAMESPACE: '${ioRealtimeNsp.path()}' , path: '${nspPath.realtime.pathname}' `)

      this.base.socketNamespace.BE_REALTIME = ioRealtimeNsp as any;

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

  public __TrigggerEntityChanges(
    entityObjOrClass: BASE_ENTITY<any> | Function,
    property?: string,
    valueOfUniquPropery?: number | string
  ) {
    if (this.context.disabledRealtime) {
      return;
    }

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

    const modelSocketRoomPath = _.isString(property) ?
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(config.className, property, valueOfUniquPropery) :
      SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(config.className, valueOfUniquPropery);

    const eventName = _.isString(property) ?
      SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(config.className, property, valueOfUniquPropery) :
      SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(config.className, valueOfUniquPropery);

    const job = () => {
      this.base.socketNamespace.BE_REALTIME.in(modelSocketRoomPath).emit(eventName, '');
    }

    if (!_.isFunction(RealtimeNodejs.jobs[eventName])) {
      log.i('CREATE FUNCTION DEBOUNCE')
      RealtimeNodejs.jobs[eventName] = _.debounce(() => {
        job()
      }, 500);
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
        context.node?.realtime?.__TrigggerEntityChanges(entityObjOrClass, propertyFromArr as any, idToTrigger)
      })
    } else {
      context.node?.realtime?.__TrigggerEntityChanges(entityObjOrClass, property as any, idToTrigger)
    };
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
    context.node?.realtime?.__TrigggerEntityChanges(entityObjOrClass as any, void 0, idToTrigger);
  }

}
