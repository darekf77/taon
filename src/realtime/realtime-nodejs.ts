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
const log = Log.create('RealtimeNodejs', Level.__NOTHING)

export class RealtimeNodejs {
  //#region @backend
  init(http: Http2Server) {
    const uri: URL = Global.vars.urlSocket;
    if (!uri) {
      console.warn(`
        MORPHI: Please use { hostSocket } in morphi init(..)
        function to make socket works
      `)
      return
    }

    Global.vars.socketNamespace.BE = io(http);


    const nsp = Global.vars.socketNamespace.BE;
    nsp.on('connection', (clientSocket) => {
      // console.log('client conected to namespace', clientSocket.nsp.name)
    })

    const nspRealtime = nsp.of(SYMBOL.REALTIME.NAMESPACE);

    Global.vars.socketNamespace.BE_REALTIME = nspRealtime;

    nspRealtime.on('connection', (clientSocket) => {
      // console.log('client conected to namespace', clientSocket.nsp.name)

      clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
        // console.log(`Joining room ${room} in namespace ${nspRealtime.name} `)
        clientSocket.join(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
        // console.log(`Joining room ${room} in namespace ${nspRealtime.name} `)
        clientSocket.join(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, room => {
        // console.log(`Leaving room ${room} in namespace ${nspRealtime.name} `)
        clientSocket.leave(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, room => {
        // console.log(`Leaving room ${room} in namespace ${nspRealtime.name} `)
        clientSocket.leave(room);
      })

    })


  }


  public static TrigggerEntityPropertyChanges(entity: BASE_ENTITY<any>, property: string) {
    return this.__TrigggerEntityChanges(entity, property)
  }

  public static TrigggerEntityChanges(entity: BASE_ENTITY<any>) {
    return this.__TrigggerEntityChanges(entity)
  }

  public static __TrigggerEntityChanges(entity: BASE_ENTITY<any>, property?: string) {
    const keyPropertyName = 'id'
    log.d('event afer update', event);

    if (!entity || !entity[keyPropertyName]) {
      console.error(`Entity without iD !!!! from event`, event)
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

      console.log(`Push entity${_.isString(property) ? ('.' + property) : ''} to room with path: ${modelSocketRoomPath}`)

      if (_.isString(property)) {
        console.log('populate entity property change to ', SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id))
        Global.vars.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
          .emit(SYMBOL.REALTIME.EVENT.ENTITY_PROPTERY_UPDATE_BY_ID(className, property, id), '')
      } else {
        console.log('populate entity change to ', SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id))
        Global.vars.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
          .emit(SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id), '')
      }

    }
  }

  request(req: Request, res: Response) {

    // res.on('finish', () => {
    //   // console.log(res.statusCode + ': 1' + req.method);
    //   const statusCode = res.statusCode;
    //   const method: HttpMethod = req.method as any;
    //   if (method !== 'GET' && !isNaN(statusCode) && statusCode >= 200 && statusCode < 300) {
    //     const m: MethodConfig = res[SYMBOL.METHOD_DECORATOR];
    //     const c: ClassConfig = res[SYMBOL.CLASS_DECORATOR];
    //     let pathes = Object.keys(c.methods)
    //       .filter(k => c.methods[k].realtimeUpdate)
    //       .map(k => getExpressPath(c, c.methods[k].path));
    //     // socket.emit(SOCKET_MSG, {
    //     //   method: 'GET',
    //     //   pathes
    //     // });
    //   }
    // });
  }


  //#endregion
}
