import * as io from 'socket.io-client';

import { Global } from '../global-config';
import { SYMBOL } from '../symbols';

import { Log, Level } from 'ng2-logger';
const log = Log.create('RealtimeBrowser', Level.__NOTHING)


export class RealtimeBrowser {
  init() {
    let uri: URL = Global.vars.urlSocket;
    if (!uri) {
      log.warn(`
        MORPHI: Please use { hostSocket } in morphi init(..)
        function to make socket works
      `)
      return
    }

    const global = io(uri.href, {
      path: uri.pathname !== '/' ? uri.pathname : undefined
    });
    Global.vars.socketNamespace.FE = global as any;

    global.on('connect', () => {
      log.i(`conented to namespace ${global.nsp}`)
    });

    const realtimeNamespaceHref = `${uri.href}${SYMBOL.REALTIME.NAMESPACE}`
    log.i('realtimeNamespaceHref', realtimeNamespaceHref)

    const realtime = io(realtimeNamespaceHref, {
      path: uri.pathname !== '/' ? uri.pathname : undefined
    }) as any;
    Global.vars.socketNamespace.FE_REALTIME = realtime;

    realtime.on('connect', () => {
      log.i(`conented to namespace ${realtime.nsp}`)
    });


  }
}
