import { Global } from '../global-config';
import * as _ from 'lodash';
// import { HttpMethod, MethodConfig, ClassConfig } from 'ng2-rest';

//#region @backend
import { Http2Server } from 'http2';
import * as io from 'socket.io';
import { Response, Request } from "express";
import { SYMBOL } from '../symbols';
//#endregion

import { Log, Level } from 'ng2-logger';
import { BASE_ENTITY } from '../framework/framework-entity';
import { Helpers } from '../helpers';
import { RealtimeHelper } from './realtime-helper';
const log = Log.create('RealtimeNodejs', Level.__NOTHING)

export class RealtimeNodejs {
  //#region @backend
  static init(http: Http2Server) {

    const nspPath = {
      global: RealtimeHelper.pathFor(),
      realtime: RealtimeHelper.pathFor(SYMBOL.REALTIME.NAMESPACE)
    };


    Global.vars.socketNamespace.BE = io(http, {
      path: nspPath.global.pathname
    });


    const ioGlobalNsp = Global.vars.socketNamespace.BE;

    ioGlobalNsp.on('connection', (clientSocket) => {
      log.i('client conected to namespace', clientSocket.nsp.name)
    })

    log.i(`CREATE GLOBAL NAMESPACE: '${ioGlobalNsp.path()}' , path: '${nspPath.global.pathname}'`)

    const ioRealtimeNsp = io(http, {
      path: nspPath.realtime.pathname
    });

    log.i(`CREATE REALTIME NAMESPACE: '${ioRealtimeNsp.path()}' , path: '${nspPath.realtime.pathname}' `)

    Global.vars.socketNamespace.BE_REALTIME = ioRealtimeNsp as any;

    ioRealtimeNsp.on('connection', (clientSocket) => {
      log.i('client conected to namespace', clientSocket.nsp.name)

      clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
        log.i(`Joining room ${room} in namespace  REALTIME`)
        clientSocket.join(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
        log.i(`Joining room ${room} in namespace REALTIME `)
        clientSocket.join(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
        log.i(`Leaving room ${room} in namespace REALTIME `)
        clientSocket.leave(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
        log.i(`Leaving room ${room} in namespace REALTIME `)
        clientSocket.leave(room);
      })

    })


  }

  private static jobs = {};

  public static __TrigggerEntityChanges(entity: BASE_ENTITY<any>, property?: string) {
    const keyPropertyName = 'id'


    if (!entity || !entity[keyPropertyName]) {
      console.error(`Entity without iD !!!! `, entity)
      return
    }

    const id = entity[keyPropertyName];
    // Global.vars.socket.BE.sockets.in()\

    const constructFn = Helpers.Class.getFromObject(entity);
    // console.log('construcFN', constructFn)
    if (!constructFn) {
      log.d('not found class function from', entity)
    } else {
      const className = Helpers.Class.getName(constructFn);

      const modelSocketRoomPath = _.isString(property) ?
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(className, property, entity.id) :
        SYMBOL.REALTIME.ROOM_NAME.UPDATE_ENTITY(className, id);

      // console.log(`Push entity${_.isString(property) ? ('.' + property) : ''} to room with path: ${modelSocketRoomPath}`)

      const eventName = _.isString(property) ?
        SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, id) :
        SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id);

      const job = () => {
        if (_.isString(property)) {
          // console.log('populate entity property change to ', SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id))
          Global.vars.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
            .emit(eventName, '')
        } else {
          log.i('populate entity change to ', SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id))
          Global.vars.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
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


  public static TrigggerEntityPropertyChanges<ENTITY = any>(entity: BASE_ENTITY<any>, property: (keyof ENTITY) | (keyof ENTITY)[]) {
    if (_.isArray(property)) {
      property.forEach(p => {
        RealtimeNodejs.__TrigggerEntityChanges(entity, p as any)
      })
      return
    }
    RealtimeNodejs.__TrigggerEntityChanges(entity, property as any)
  }

  public static TrigggerEntityChanges(entity: BASE_ENTITY<any>) {
    RealtimeNodejs.__TrigggerEntityChanges(entity)
  }

  //#endregion
}
