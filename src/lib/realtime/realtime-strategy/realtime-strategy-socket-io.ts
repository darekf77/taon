import { Server } from 'socket.io'; // @esmRemvoe
import { io } from 'socket.io-client'; // @esmRemvoe

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
    //#region @esmRemove
    return new Server(...args);
    //#endregion
    return void 0 as any;
    //#endregion
  }

  get ioClient() {
    //#region @esmRemove
    return io;
    //#endregion
    return void 0 as any;
  }
}
