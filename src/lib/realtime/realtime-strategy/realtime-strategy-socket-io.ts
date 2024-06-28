import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
//#region @backend
import { Server } from 'socket.io';
//#endregion
import { io } from 'socket.io-client';

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

  get Server() {
    //#region @backendFunc
    return Server;
    //#endregion
  };

  get io() {
    return io;
  }

  establishConnection(): void {
    throw new Error('Method not implemented.');
  }
}


