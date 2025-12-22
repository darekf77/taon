
import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
//#region @backend
import { Server, ServerOptions } from 'socket.io';
//#endregion
import { io, ManagerOptions, Socket, SocketOptions } from 'socket.io-client';

/**
 * Purpose:
 * - backend-browser communication
 * - backend-backend communication
 */
export class RealtimeStrategySocketIO extends RealtimeStrategy {
  toString(): string {
    return 'socket-io';
  }
  constructor(protected ctx: EndpointContext) {
    super(ctx);
  }

  ioServer(...args) {
    //#region @backendFunc
    return new Server(...args);
    //#endregion
  }

  get ioClient() {
    return io;
  }
}
