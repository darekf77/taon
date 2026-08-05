import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';

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
    const { Server } = require('socket.io');
    return new Server(...args);
    //#endregion
  }

  get ioClient() {
    const { io } = require('socket.io-client');
    return io;
  }
}
