//#region imports
import { Socket as SocketClient } from 'socket.io-client';
import type { EndpointContext } from '../endpoint-context';
import { RealtimeClient } from './realtime-client';
import { RealtimeServer } from './realtime-server';
import type { RealtimeStrategy } from './realtime-strategy';
import {
  RealtimeStrategyIpc,
  RealtimeStrategyMock,
  RealtimeStrategySocketIO,
} from './realtime-strategy';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Server } from 'socket.io';
import { Helpers } from 'tnp-core/src';
//#endregion

/**
 * Realtime class
 * - mock (when browser-browser)
 * - sockets (from socket io when backend-browser)
 * - ipc (when electron is used or between processes)
 * - webworker (when webworker is used in browser or nodejs)
 */
export class RealtimeCore {
  //#region fields
  readonly allHttpMethods = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'HEAD',
  ];
  public readonly client: RealtimeClient;
  public readonly server: RealtimeServer;
  public readonly strategy: RealtimeStrategy;

  /**
   * global FE socket - only for established connection
   */
  public conectSocketFE: SocketClient<DefaultEventsMap, DefaultEventsMap>;
  /**
   * socket for namespaces and rooms
   */
  public socketFE: SocketClient<DefaultEventsMap, DefaultEventsMap>;
  /**
   * global BE socket - only for established connection
   */
  public connectSocketBE: Server<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >;
  /**
   * socket for namespaces and rooms
   */
  public socketBE: Server<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  >;
  //#endregion

  //#region constructor
  constructor(public ctx: EndpointContext) {
    this.ctx = ctx;
    this.strategy = this.resolveStrategy();

    this.ctx.logRealtime &&
      console.log(`[taon] realtime strategy: ${this.strategy}`);
    if (Helpers.isWebSQL) {
      this.server = new RealtimeServer(this as any);
      // console.log('DONE INITING SERVER');
      this.client = new RealtimeClient(this as any);
      // console.log('DONE INITING CLIENT');
    } else {
      this.client = new RealtimeClient(this as any);
      this.server = new RealtimeServer(this as any);
    }
  }
  //#endregion

  //#region methods & getters / resovle staraegy
  private resolveStrategy(): RealtimeStrategy {
    if (
      this.ctx.mode === 'backend-frontend(websql)' ||
      this.ctx.mode === 'backend-frontend(websql-electron)'
    ) {
      // debugger
      return new RealtimeStrategyMock(this.ctx);
    }
    if (this.ctx.mode === 'backend-frontend(ipc-electron)') {
      return new RealtimeStrategyIpc(this.ctx);
    }
    // if (this.ctx.mode === 'backend-frontend(tcp+udp)') {
    //   return new RealtimeStrategySocketIO(this.ctx);
    // }
    // if (this.ctx.mode === 'remote-backend(tcp+udp)') {
    //   return new RealtimeStrategySocketIO(this.ctx);
    // }
    return new RealtimeStrategySocketIO(this.ctx);
  }
  //#endregion

  //#region path for
  public pathFor(namespace?: string) {
    const uri = this.ctx.uri;

    let nsp = namespace ? namespace : '';
    nsp = nsp === '/' ? '' : nsp;
    const pathname = uri.pathname !== '/' ? uri.pathname : '';
    let prefix = `taonContext`;
    if (Helpers.isElectron) {
      prefix = ``;
    }
    const href = `${uri.origin}${pathname}/${prefix}${prefix && nsp ? '-' + nsp : nsp}`;
    // console.log(`HREF: ${href}, nsp: ${nsp}`)
    return new URL(href) as URL;
  }
  //#endregion
}
