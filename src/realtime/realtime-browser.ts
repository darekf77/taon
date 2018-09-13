import { Global } from '../global-config';
import * as io from 'socket.io-client';
import { SYMBOL } from '../symbols';
// import { HttpMethod } from 'ng2-rest';

export class RealtimeBrowser {
  init() {
    let uri: URL = Global.vars.urlSocket;
    if (!uri) {
      console.warn(`
        MORPHI: Please use { hostSocket } in morphi init(..)
        function to make socket works
      `)
      return
    }
    // const routePathame = (uri.pathname !== '/');
    // console.log('uri', uri)
    // console.log('uri.pathname', uri.pathname)
    const feRealtime = io(uri.href, {
      // path: uri.pathname !== '/' ? `${uri.pathname}/socket.io` : undefined,
      path: uri.pathname !== '/' ? uri.pathname : undefined,
      // transports: routePathame ?
      //     [
      //       'websocket',
      //       'flashsocket',
      //       'htmlfile',
      //       'xhr-polling',
      //       'jsonp-polling',
      //       'polling']
      //     : undefined,

      // transports: [
      //   'websocket',
      //   'flashsocket',
      // 'htmlfile',
      // 'xhr-polling',
      // 'jsonp-polling',
      // 'polling'
      // ]
    });

    Global.vars.socket.FE = feRealtime as any;

    console.log(feRealtime)

  //   let d = feRealtime.io.socket('/adasdasd')
  //   d.

  //   feRealtime.emit('test message');
  // }

  // intReplay() {
  //   // socket.on(SYMBOL.SOCKET_MSG, function (msg) {
  //   //   if (msg && Array.isArray(msg.pathes)) {
  //   //     msg.pathes.forEach(p => this.replay(p, msg.method))
  //   //   }
  //   // });
  // }

  // replay(model: string, method: HttpMethod) {
  //   // if (!model || !method) {
  //   //   console.warn(`Incorrect method ${method} and model ${model}`);
  //   //   return;
  //   // }
  //   // console.info(`replay ${model}, ${method}`)
  //   // const uri: URL = Global.vars.url;
  //   // const endpoints = window[SYMBOL.ENDPOINT_META_CONFIG];
  //   // console.log('window', window)
  //   // console.log('endpoints', endpoints)
  //   // const endpoint = uri.href;
  //   // const rest = endpoints[endpoint][model];
  //   // console.log('rest', rest)
  //   // if (rest) {
  //   //   rest.replay(method);
  //   // } else {
  //   //   console.warn(`No used method ${method} from ${endpoint}/${model}`);
  //   // }
  // }
}
