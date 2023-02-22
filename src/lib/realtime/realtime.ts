import { Socket } from 'socket.io'
import * as socketio from 'socket.io'
import { FrameworkContext } from '../framework/framework-context';
import type { BroadcastApiIoMockServer } from './broadcast-api-io-mock-server';
import type { BroadcastApiIoMockClient } from './broadcast-api-io-mock-client';

export class RealtimeBase {

  private static contexts = [];
  private static instances = [];
  public static by(context: FrameworkContext): RealtimeBase {
    const indexContext = this.contexts.findIndex(c => c === context);
    if (indexContext === -1) {
      this.contexts.push(context);
      const instance = new RealtimeBase(context)
      this.instances.push(instance);
      return instance;
    } else {
      return this.instances[indexContext];
    }
  }

  public FE: BroadcastApiIoMockClient; //  Socket; // TODO QUICK_FIX
  public FE_REALTIME: BroadcastApiIoMockClient; //  Socket; // TODO QUICK_FIX;
  //#region @websql
  public BE: BroadcastApiIoMockServer; // socketio.Server;
  public BE_REALTIME: BroadcastApiIoMockServer; // socketio.Namespace;
  //#endregion


  private constructor(protected context: FrameworkContext) {

  }

  public pathFor(namespace?: string) {
    const uri = this.context.uri;
    const nsp = namespace ? namespace : '';
    const pathname = uri.pathname !== '/' ? uri.pathname : '';
    const prefix = `socketnodejs`;
    const href = `${uri.origin}${pathname}/${prefix}${nsp}`;
    // console.log(`HREF: ${href}`)
    return new URL(href) as URL;
  }

}
