import { Server } from 'socket.io';
import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
import { ioIpcStrategy } from './realtime-strategy-ipc-models/realtime-strategy-ipc-main-wrapper';
import { IpcRendererWrapper } from './realtime-strategy-ipc-models/realtime-strategy-ipc-renderer-wrapper';

/**
 * Purpose:
 * - backend-browser communication between 2 processes in electron mode
 */
export class RealtimeStrategyIpc extends RealtimeStrategy {
  establishConnection(): void {
    throw new Error('Method not implemented.');
  }
  constructor(protected ctx: EndpointContext) {
    super(ctx);
  }

  get io() {
    const wrap = new IpcRendererWrapper(this.ctx.contextName);
    return wrap as any;
  }
  get Server() {
    return ioIpcStrategy as any;
  }
}
