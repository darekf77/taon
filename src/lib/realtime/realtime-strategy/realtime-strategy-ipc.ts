//#region imports
import type { ipcRenderer } from 'electron'; // @browser
import * as Electron from 'electron'; // @backend
import { ipcMain } from 'electron'; // @backend
import { Server, ServerOptions } from 'socket.io';
import type { io, ManagerOptions, SocketOptions } from 'socket.io-client';

import { EndpointContext } from '../../endpoint-context';
import { Symbols } from '../../symbols';
import { RealtimeModels } from '../realtime.models';

import { RealtimeStrategy } from './realtime-strategy';
//#endregion

//#region mock server ipc
export class MockServerIpc {
  static serverByContextName = new Map<string, MockServerIpc>();

  static from(contextName: string): MockServerIpc {
    if (!MockServerIpc.serverByContextName.has(contextName)) {
      MockServerIpc.serverByContextName.set(
        contextName,
        new MockServerIpc(contextName),
      );
    }
    return MockServerIpc.serverByContextName.get(contextName);
  }

  namespacesByName = new Map<string, MockNamespaceIpc>();

  //#region constructor
  constructor(public contextName: string) {
    MockServerIpc.serverByContextName.set(contextName, this);
  }
  //#endregion

  //#region of
  of(namespace: string): MockNamespaceIpc {
    if (!this.namespacesByName.has(namespace)) {
      this.namespacesByName.set(
        namespace,
        new MockNamespaceIpc(namespace, this),
      );
    }
    return this.namespacesByName.get(namespace);
  }
  //#endregion
}
//#endregion

//#region mock namespace ipc
export class MockNamespaceIpc {
  //#region fields & getters
  electronClients = new Set<Electron.WebContents>();
  roomsByRoomName: {
    [roomName: string]: Set<Electron.WebContents>;
  } = {};

  private namespaceEventHandlers: {
    [eventName: string]: Set<RealtimeModels.EventHandler>;
  } = {};
  //#endregion

  //#region constructor
  constructor(
    /**
     * Namespace name
     */
    public name: string,
    public server: MockServerIpc,
  ) {}
  //#endregion

  //#region on
  on(eventName: string, callback: RealtimeModels.EventHandler) {
    //#region @backendFunc
    const listenKey = `(${this.name}) "${eventName}"`;

    if (!this.namespaceEventHandlers[eventName]) {
      this.namespaceEventHandlers[eventName] = new Set();
    }
    this.namespaceEventHandlers[eventName].add(callback);

    ipcMain.on(listenKey, (eventElectron, ...args) => {
      this.electronClients.add(eventElectron.sender);

      const connectionListener = `(${this.name}) "connection"`;
      if (connectionListener === listenKey) {
        callback(this, ...args);
      } else {
        if (eventName.includes(`:${Symbols.REALTIME.KEYroomSubscribe}`)) {
          const roomName = args[0];
          this.join(eventElectron.sender, roomName);
        } else if (
          eventName.includes(`:${Symbols.REALTIME.KEYroomUnsubscribe}`)
        ) {
          const roomName = args[0];
          this.leave(eventElectron.sender, roomName);
        } else {
          callback(...args);
        }
      }
    });
    // this.emit(listenKey); // QUICK_FIX
    //#endregion
  }
  //#endregion

  //#region off
  off(event: string, callback?: RealtimeModels.EventHandler) {
    //#region @backendFunc
    if (!this.namespaceEventHandlers[event]) {
      return;
    }

    if (callback) {
      this.namespaceEventHandlers[event].delete(callback);
    } else {
      delete this.namespaceEventHandlers[event];
    }
    const removeKey = `(${this.name}) "${event}"`;
    ipcMain.removeListener(removeKey, callback);
    //#endregion
  }
  //#endregion

  //#region emit
  emit(eventName: string, ...args: any[]) {
    //#region @backendFunc
    const sendEventKey = `(${this.name}) "${eventName}"`;
    for (const webContents of this.electronClients) {
      webContents.send(sendEventKey, ...args);
    }
    // const allWindows = Electron.BrowserWindow.getAllWindows();
    // allWindows.forEach((win, index) => {
    //   win.webContents.send(sendEventKey, ...args);
    // });
    //#endregion
  }
  //#endregion

  //#region to
  to(roomName: string) {
    const electronClientsInroom = this.roomsByRoomName[roomName];
    return new RoomEmitterIpc(electronClientsInroom, this.name, true);
  }
  //#endregion

  //#region in
  in(roomName: string) {
    const electronClientsInroom = this.roomsByRoomName[roomName];
    return new RoomEmitterIpc(electronClientsInroom, this.name, false);
  }
  //#endregion

  //#region join
  join(webContents: Electron.WebContents, roomName: string) {
    if (!this.roomsByRoomName[roomName]) {
      this.roomsByRoomName[roomName] = new Set();
    }
    this.roomsByRoomName[roomName].add(webContents);
  }
  //#endregion

  //#region leave
  leave(webContents: Electron.WebContents, roomName: string) {
    if (this.roomsByRoomName[roomName]) {
      this.roomsByRoomName[roomName].delete(webContents);
      if (this.roomsByRoomName[roomName].size === 0) {
        delete this.roomsByRoomName[roomName];
      }
    }
  }
  //#endregion

  //#region path
  path() {
    return this.name;
  }
  //#endregion

  //#region get nsp
  get nsp() {
    const self = this;
    return {
      get name() {
        return self.name;
      },
    };
  }
  //#endregion
}

//#endregion

//#region room emitter ipc
class RoomEmitterIpc {
  //#region constructor
  constructor(
    private electronClients: Set<Electron.WebContents>,
    /**
     * namespace name
     */
    private name: string,
    private includeSender: boolean = false,
    private sender: MockSocketIpc = null, // TODO QUICK FIX how to include sender
  ) {}
  //#endregion

  //#region emit in room
  emit(eventName: string, ...args: any[]): void {
    const emitEvent = `(${this.name}) "${eventName}"`;
    this.electronClients?.forEach(webContents => {
      webContents.send(emitEvent, ...args);
    });
  }
  //#endregion
}
//#endregion

//#region mock socket ipc
export class MockSocketIpc {
  //#region fields & getters

  //#region fields & getters / ipc renderer
  //#region @browser
  ipcRenderer!: typeof ipcRenderer;
  //#endregion
  //#endregion

  //#region fields & getters / event handlers by name
  private socketEventHandlers = {} as {
    [eventName: string]: Set<RealtimeModels.EventHandler>;
  };
  //#endregion

  //#region fields & getters / name
  get name() {
    return this.namespaceName;
  }
  //#endregion

  //#endregion

  //#region constructor
  /**
   * @param namespaceName instead url for ipc
   */
  constructor(public namespaceName: string) {
    //#region @browser
    this.ipcRenderer = (window as any).require('electron').ipcRenderer;
    //#endregion
  }
  //#endregion

  //#region on
  on(eventName: string, callback: (event: any, ...args: any[]) => void) {
    //#region @browser
    if (!this.socketEventHandlers[eventName]) {
      this.socketEventHandlers[eventName] = new Set();
    }
    this.socketEventHandlers[eventName].add(callback);

    const listenToEvent = `(${this.name}) "${eventName}"`;
    this.ipcRenderer.on(listenToEvent, (rendereEvent, data) => {
      callback(data);
    });

    if (eventName === 'connect') {
      const connectionEventKey = `(${this.name}) "connection"`;
      this.ipcRenderer.send(connectionEventKey, this.name);
    }
    //#endregion
  }
  //#endregion

  //#region off
  off(event: string, callback?: (event: any, ...args: any[]) => void) {
    //#region @browser
    if (!this.socketEventHandlers[event]) {
      return;
    }

    if (callback) {
      this.socketEventHandlers[event].delete(callback);
    } else {
      delete this.socketEventHandlers[event];
    }
    const removeListener = `(${this.name}) "${event}"`;

    this.ipcRenderer.removeListener(removeListener, data => {
      callback(data);
    });
    //#endregion
  }
  //#endregion

  //#region emit
  emit(event: string, ...args: any[]) {
    //#region @browser
    const emitEvent = `(${this.name}) "${event}"`;
    this.ipcRenderer.send(emitEvent, ...args);
    //#endregion
  }
  //#endregion
}
//#endregion

/**
 * Purpose:
 * - backend-browser communication between 2 processes in electron mode
 */
export class RealtimeStrategyIpc extends RealtimeStrategy {
  //#region to string
  toString(): string {
    return 'ipc';
  }
  //#endregion

  //#region constructor
  constructor(protected ctx: EndpointContext) {
    super(ctx);
  }
  //#endregion

  //#region server & io
  ioServer(__: string, opt: ServerOptions) {
    const namespace = opt?.path || '/';
    const server = MockServerIpc.from(this.ctx.contextName);
    return server.of(namespace) as any;
  }

  get ioClient() {
    const clientIo = (
      __: string,
      opt?: Partial<ManagerOptions & SocketOptions>,
    ): MockSocketIpc => {
      const namespace = opt?.path || '/';
      return new MockSocketIpc(namespace);
    };
    return clientIo as any;
  }
  //#endregion
}
