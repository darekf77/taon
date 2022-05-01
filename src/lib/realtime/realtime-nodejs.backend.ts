import { _ } from 'tnp-core';
import * as io from 'socket.io';
import { SYMBOL } from '../symbols';
import { Log, Level } from 'ng2-logger';
import { BASE_ENTITY } from '../framework/framework-entity';
import { RealtimeBase } from './realtime';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkContext } from '../framework/framework-context';
const log = Log.create('RealtimeNodejs',
  Level.__NOTHING
);

export class RealtimeNodejs extends RealtimeBase {
  private static jobs = {};

  constructor(context: FrameworkContext) {
    super(context);
    if (!context.disabledRealtime) {

      const nspPath = {
        global: this.pathFor(),
        realtime: this.pathFor(SYMBOL.REALTIME.NAMESPACE)
      };


      this.socketNamespace.BE = io(this.context.node.httpServer, {
        path: nspPath.global.pathname
      });


      const ioGlobalNsp = this.socketNamespace.BE;

      ioGlobalNsp.on('connection', (clientSocket) => {
        log.i(`client conected to namespace "${clientSocket.nsp.name}",  host: ${this.context.host}`)
      })

      log.i(`CREATE GLOBAL NAMESPACE: '${ioGlobalNsp.path()}' , path: '${nspPath.global.pathname}'`)

      const ioRealtimeNsp = io(this.context.node.httpServer, {
        path: nspPath.realtime.pathname
      });

      log.i(`CREATE REALTIME NAMESPACE: '${ioRealtimeNsp.path()}' , path: '${nspPath.realtime.pathname}' `)

      this.socketNamespace.BE_REALTIME = ioRealtimeNsp as any;

      ioRealtimeNsp.on('connection', (clientSocket) => {
        log.i(`client conected to namespace "${clientSocket.nsp.name}",  host: ${this.context.host}`)

        clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
          log.i(`Joining room ${room} in namespace  REALTIME` + ` host: ${this.context.host}`)
          clientSocket.join(room);
        })

        clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
          log.i(`Joining room ${room} in namespace REALTIME ` + ` host: ${this.context.host}`)
          clientSocket.join(room);
        })

        clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
          log.i(`Leaving room ${room} in namespace REALTIME ` + ` host: ${this.context.host}`)
          clientSocket.leave(room);
        })

        clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
          log.i(`Leaving room ${room} in namespace REALTIME ` + ` host: ${this.context.host}`)
          clientSocket.leave(room);
        })

      })
    }

  }



  public __TrigggerEntityChanges(
    entity: BASE_ENTITY<any> | string | Function,
    property?: string,
    idToTrigger?: number | string
  ) {
    if (this.context.disabledRealtime) {
      return;
    }
    if (_.isFunction(entity)) {
      entity = CLASS.getName(entity);
    }
    if (_.isString(entity) && !(_.isString(idToTrigger) || _.isNumber(idToTrigger))) {
      throw new Error(`[Firedev][realtime-nodejs] `
      + `Please provide id if you are trigerring realtime change for entity by name: "${entity}"`);
    }
    const keyPropertyName = 'id';

    if (!idToTrigger) {
      if (!entity || !entity[keyPropertyName]) {
        console.error(`Entity without iD !!!! `, entity)
        return
      }
    }


    const id = (idToTrigger ? idToTrigger : entity[keyPropertyName]) as any;
    // Global.vars.socket.BE.sockets.in()\

    const constructFn = _.isString(entity) ? CLASS.getBy(entity) : CLASS.getFromObject(entity);
    // console.log('construcFN', constructFn)
    if (!constructFn) {
      log.d('not found class function from', entity)
    } else {
      const className = CLASS.getName(constructFn);

      const modelSocketRoomPath = _.isString(property) ?
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, id) :
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, id);

      // console.log(`Push entity${_.isString(property) ? ('.' + property) : ''} to room with path: ${modelSocketRoomPath}`)

      const eventName = _.isString(property) ?
        SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, id) :
        SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id);

      const job = () => {
        if (_.isString(property)) {
          // console.log('populate entity property change to ', SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id))
          this.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
            .emit(eventName, '')
        } else {
          log.i('populate entity change to ',
            SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id)
            + ` host: ${this.context.host}`
          )
          this.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
            .emit(eventName, '')
        }
      }

      if (!_.isFunction(RealtimeNodejs.jobs[eventName])) {
        log.i('CREATE FUNCTION DEBOUNCE')
        RealtimeNodejs.jobs[eventName] = _.debounce(() => {
          job()
        }, 500);
      }

      RealtimeNodejs.jobs[eventName]()

    }
  }


  public static TrigggerEntityPropertyChanges<ENTITY = any>(
    entity: BASE_ENTITY<any> | string | Function,
    property: (keyof ENTITY) | (keyof ENTITY)[],
    idToTrigger?: number | string,
  ) {
    const context = FrameworkContext.findForTraget(entity);
    return context.node?.realtime?.TrigggerEntityPropertyChanges(entity, property, idToTrigger);
  }

  public TrigggerEntityPropertyChanges<ENTITY = any>(
    entity: BASE_ENTITY<any> | string | Function,
    property: (keyof ENTITY) | (keyof ENTITY)[],
    idToTrigger?: number | string
  ) {
    if (this.context.disabledRealtime) {
      return;
    }
    if (_.isArray(property)) {
      property.forEach(p => {
        this.__TrigggerEntityChanges(entity, p as any, idToTrigger)
      })
      return
    }
    this.__TrigggerEntityChanges(entity, property as any, idToTrigger)
  }

  public static TrigggerEntityChanges(entity: BASE_ENTITY<any> | string | Function, idToTrigger?: number | string) {
    if (_.isFunction(entity)) {
      entity = CLASS.getName(entity);
    }
    const context = FrameworkContext.findForTraget(entity);
    return context.node?.realtime?.TrigggerEntityChanges(entity as any, idToTrigger);
  }

  public TrigggerEntityChanges(entity: BASE_ENTITY<any>, idToTrigger?: number | string) {
    if (this.context.disabledRealtime) {
      return;
    }
    this.__TrigggerEntityChanges(entity, void 0, idToTrigger)
  }


}
