import { Server } from 'socket.io';
import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
import { ioIpcStrategy as IoIpcStrategy } from './realtime-strategy-ipc-models/realtime-strategy-ipc-main-wrapper';
import { IpcRendererWrapper } from './realtime-strategy-ipc-models/realtime-strategy-ipc-renderer-wrapper';
import type { io } from 'socket.io-client';

/**
 * Purpose:
 * - backend-browser communication between 2 processes in electron mode
 */
export class RealtimeStrategyIpc extends RealtimeStrategy {
  toString(): string {
    return 'ipc';
  }
  establishConnection(): void {
    throw new Error('Method not implemented.');
  }
  constructor(protected ctx: EndpointContext) {
    super(ctx);
  }

  contextsServers: { [contextName: string]: Server } = {};
  contextsIO: { [contextName: string]: typeof io } = {};

  get io() {
    //#region @browser
    return ((__, { path: namespacePath }) => {
      if (this.contextsIO[namespacePath]) {
        return this.contextsIO[namespacePath];
      }
      const wrap = new IpcRendererWrapper(this.ctx.contextName);
      // console.log(`[FRONTEND][IPC] namespace("${namespacePath}")`);
      const nsp = wrap.of(namespacePath);
      this.contextsIO[namespacePath] = nsp as any;
      return nsp;
    }) as any;
    //#endregion
    return void 0;
  }
  get Server() {
    //#region @websql
    return ((___, { path: namespacePath }) => {
      if (this.contextsServers[namespacePath]) {
        return this.contextsServers[namespacePath];
      }
      const wrap = new IoIpcStrategy(this.ctx.contextName);
      // console.log(`[SERVER][IPC] namespace("${namespacePath}")`);
      const nsp = wrap.of(namespacePath);
      this.contextsServers[namespacePath] = nsp as any;
      return nsp;
    }) as any;
    //#endregion
    return void 0;
  }
}
