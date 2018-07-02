import { Global } from '../global-config';
import * as io from 'socket.io-client';
import { SYMBOL } from '../symbols';
import { HttpMethod } from 'ng2-rest';

export class RealtimeBrowser {
  init() {
    const uri: URL = Global.vars.url;
    const socket = io(uri.href);
    socket.emit('chat message');
    socket.on(SYMBOL.SOCKET_MSG, function (msg) {
      if (msg && Array.isArray(msg.pathes)) {
        msg.pathes.forEach(p => this.replay(p, msg.method))
      }
    });
  }

  replay(model: string, method: HttpMethod) {
    if (!model || !method) {
      console.warn(`Incorrect method ${method} and model ${model}`);
      return;
    }
    console.info(`replay ${model}, ${method}`)
    const uri: URL = Global.vars.url;
    const endpoints = window[SYMBOL.ENDPOINT_META_CONFIG];
    // console.log('window', window)
    // console.log('endpoints', endpoints)
    const endpoint = uri.href;
    const rest = endpoints[endpoint][model];
    // console.log('rest', rest)
    if (rest) {
      rest.replay(method);
    } else {
      console.warn(`No used method ${method} from ${endpoint}/${model}`);
    }
  }
}
