import { Global } from '../global-config';
import { HttpMethod, MethodConfig, ClassConfig } from 'ng2-rest';

//#region @backend
import { Http2Server } from 'http2';
import * as io from 'socket.io';
import { Response, Request } from "express";
import { getExpressPath } from '../models';
import { SYMBOL } from '../symbols';
//#endregion


export class RealtimeNodejs {
  //#region @backend
  init(http: Http2Server) {

    Global.vars.socket = io(http);
    Global.vars.socket.on('connection', (socket) => {
      console.log('user connected');
      socket.on('disconnect', function () {
        console.log('user disconnected');
      });
    });

  }

  request(req: Request, res: Response) {

    res.on('finish', () => {
      // console.log(res.statusCode + ': 1' + req.method);
      const statusCode = res.statusCode;
      const method: HttpMethod = req.method as any;
      if (method !== 'GET' && !isNaN(statusCode) && statusCode >= 200 && statusCode < 300) {
        const m: MethodConfig = res[SYMBOL.METHOD_DECORATOR];
        const c: ClassConfig = res[SYMBOL.CLASS_DECORATOR];
        let pathes = Object.keys(c.methods)
          .filter(k => c.methods[k].realtimeUpdate)
          .map(k => getExpressPath(c, c.methods[k].path));
        // socket.emit(SOCKET_MSG, {
        //   method: 'GET',
        //   pathes
        // });
      }
    });
  }


   //#endregion
}
