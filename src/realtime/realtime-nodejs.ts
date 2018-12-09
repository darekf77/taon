import { Global } from '../global-config';
// import { HttpMethod, MethodConfig, ClassConfig } from 'ng2-rest';

//#region @backend
import { Http2Server } from 'http2';
import * as io from 'socket.io';
import { Response, Request } from "express";
import { getExpressPath } from '../models';
import { SYMBOL } from '../symbols';
//#endregion

import { Log, Level } from 'ng2-logger';
import { getClassFromObject } from 'ng2-rest/helpers';
import { getClassName } from 'ng2-rest/classname';
import { META } from '../meta-info';
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

      clientSocket.on(SYMBOL.REALTIME.ROOM.SUBSCRIBE_ENTITY_EVENTS, room => {
        // console.log(`Joining room ${room} in namespace ${nspRealtime.name} `)
        clientSocket.join(room);
      })

      clientSocket.on(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE_ENTITY_EVENTS, room => {
        // console.log(`Leaving room ${room} in namespace ${nspRealtime.name} `)
        clientSocket.leave(room);
      })

    })


  }


  public static populate(event: { entity: META.BASE_ENTITY<any> }) {
    log.d('event afer update', event);
    // console.log('controller', self)
    const entity = event.entity

    if (!entity || !entity['id']) {
      console.error(`Entity without iD !!!! from event`, event)
      return
    }

    const id = entity['id'];
    // Global.vars.socket.BE.sockets.in()\

    const constructFn = getClassFromObject(event.entity);
    // console.log('construcFN', constructFn)
    if (!constructFn) {
      log.d('not found class function from', event.entity)
    } else {
      const className = getClassName(constructFn);

      const modelSocketRoomPath = SYMBOL.REALTIME.ROOM_NAME(className, id);
      console.log(`Push entity to room with path: ${modelSocketRoomPath}`)


      console.log('populate entity change to ', SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id))
      Global.vars.socketNamespace.BE_REALTIME.in(modelSocketRoomPath)
        .emit(SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, id), '')
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
