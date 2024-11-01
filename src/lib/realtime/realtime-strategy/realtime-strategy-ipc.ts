//#region imports
import { Server } from 'socket.io';
import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
import type { io } from 'socket.io-client';
import type { ipcRenderer } from 'electron';
//#region @backend
import * as Electron from 'electron';
import { ipcMain } from 'electron';
//#endregion
//#endregion

//#region models
export interface RendererEventListeners {
  [event: string]: Array<(event: any, ...args: any[]) => void>;
}

export interface EventListeners {
  [event: string]: Array<
    (event: Electron.IpcMainEvent, ...args: any[]) => void
  >;
}

export interface Rooms {
  [room: string]: Set<Electron.WebContents>;
}

export interface Namespaces {
  [namespace: string]: IpcMainNamespace;
}

//#endregion

//#region ipc main namespace
export class IpcMainNamespace {
  private rooms: Rooms = {};
  private listeners: EventListeners = {};

  constructor(public name: string) {}

  on(
    event: string,
    callback: (event: Electron.IpcMainEvent, ...args: any[]) => void,
  ) {
    //#region @backendFunc
    const listenKey = `(${this.name}) "${event}"`;
    // console.log(`[BACKEND]][IPC][MAIN NAMSEPACE] listenToEvent "${listenKey}"`);
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    ipcMain.on(listenKey, callback);
    this.emit(listenKey); // QUICK_FIX
    //#endregion
  }

  off(
    event: string,
    callback?: (event: Electron.IpcMainEvent, ...args: any[]) => void,
  ) {
    //#region @backendFunc
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(
        listener => listener !== callback,
      );
    } else {
      delete this.listeners[event];
    }
    const removeKey = `(${this.name}) "${event}"`;
    // console.log(`[BACKEND]][IPC][MAIN NAMSEPACE]  removeKey ${removeKey}`);
    ipcMain.removeListener(removeKey, callback);
    //#endregion
  }

  emit(event: string, ...args: any[]) {
    //#region @backendFunc
    const sendEventKey = `(${this.name}) "${event}"`;
    // console.log(`[BACKEND]][IPC][MAIN NAMSEPACE] emitEvent "${sendEventKey}"`);
    const allWindows = Electron.BrowserWindow.getAllWindows();
    allWindows.forEach((win, index) => {
      win.webContents.send(sendEventKey, ...args);
    });
    //#endregion
  }

  to(room: string) {
    return {
      emit: (event: string, ...args: any[]) => {
        const emitEvent = `(${this.name}) "${event}"`;
        // console.log(
        //   `[BACKEND]][IPC][MAIN NAMSEPACE] emitEvent in room "${room}"` +
        //     ` (exited=${!!this.rooms[room]}) "${emitEvent}"`,
        // );
        const allWindows = Electron.BrowserWindow.getAllWindows();
        allWindows.forEach((win, index) => {
          win.webContents.send(emitEvent, ...args);
        });
      },
    };
  }

  in(room: string) {
    return {
      emit: (event: string, ...args: any[]) => {
        // console.log(
        //   `[BACKEND]][IPC][MAIN NAMSEPACE] ` +
        //     ` emit in room "${room}" "${event}"`,
        // );
        const sendEventKey = `(${this.name}) "${event}"`;
        const allWindows = Electron.BrowserWindow.getAllWindows();
        allWindows.forEach((win, index) => {
          win.webContents.send(sendEventKey, ...args);
        });
      },
    };
  }

  join(webContents: Electron.WebContents, room: string) {
    if (!this.rooms[room]) {
      this.rooms[room] = new Set();
    }
    this.rooms[room].add(webContents);
    // console.log(
    //   `[BACKEND]][IPC][MAIN NAMSEPACE] joinRoom "${room}"`,
    //   this.rooms[room].size,
    // );
  }

  leave(webContents: Electron.WebContents, room: string) {
    if (this.rooms[room]) {
      this.rooms[room].delete(webContents);
      if (this.rooms[room].size === 0) {
        delete this.rooms[room];
      }
    }
    // console.log(
    //   `[BACKEND]][IPC][MAIN NAMSEPACE] leaveRoom "${room}"`,
    //   this.rooms[room] ? this.rooms[room].size : 'no room',
    // );
  }

  path() {
    return this.name;
  }

  get nsp() {
    const self = this;
    return {
      get name() {
        return self.name;
      },
    };
  }
}
//#endregion

//#region ipc renderer wrapper
export class IpcRendererWrapper {
  private namespaces: { [namespace: string]: IpcRendererNamespace } = {
    '/': new IpcRendererNamespace('/'),
  };
  private connected = false;

  constructor(public contextName: string) {
    // console.log(`IpcRendererWrapper created for context: "${contextName}"`);
  }

  of(namespace: string): IpcRendererNamespace {
    // console.log(
    //   `[BROWSSER]][IPC] of namespace"${namespace}"`,
    // );
    if (!this.namespaces[namespace]) {
      this.namespaces[namespace] = new IpcRendererNamespace(namespace);
    }
    return this.namespaces[namespace];
  }

  on(event: string, callback: (event: any, ...args: any[]) => void) {
    // if (event === 'connection' || event === 'connect') {
    //   setTimeout(() => {
    //     callback(null, null);
    //   });
    //   return;
    // }
    // console.log(
    //   `[BROWSSER]][IPC] on "${event}"`,
    // );
    this.namespaces['/'].on(event, callback);
  }

  emit(event: string, ...args: any[]) {
    // console.log(
    //   `[BROWSSER]][IPC] emit "${event}"`,
    // );
    this.namespaces['/'].emit(event, ...args);
  }
}
//#endregion

//#region io ipc strategy
export class IoIpcStrategy {
  private namespaces: Namespaces = {
    ' /': new IpcMainNamespace('/'),
  };

  constructor(public contextName: string) {
    // console.log(`IpcMainWrapper created for context: "${contextName}"`);
  }

  of(namespace: string): IpcMainNamespace {
    if (!this.namespaces[namespace]) {
      this.namespaces[namespace] = new IpcMainNamespace(namespace);
    }
    return this.namespaces[namespace];
  }

  on(
    event: string,
    callback: (event: Electron.IpcMainEvent, ...args: any[]) => void,
  ) {
    const eventKey = `(${this.contextName}) "${event}"`;
    // console.log(`[BACKEND]][IPC][MAIN] listenToEvent "${eventKey}"`);
    this.namespaces['/'].on(eventKey, callback);
  }

  emit(event: string, ...args: any[]) {
    const eventKey = `(${this.contextName}) "${event}"`;
    // console.log(`[BACKEND]][IPC][MAIN] emitEven "${eventKey}"`);
    this.namespaces['/'].emit(eventKey, ...args);
  }

  path() {
    return '/';
  }

  get nsp() {
    return {
      get name() {
        return '/';
      },
    };
  }

  in(room: string) {
    return {
      emit: (event: string, ...args: any[]) => {
        // console.log(`[BACKEND]][IPC][MAIN] emit in room "${room}" "${event}"`);
        Object.values(this.namespaces).forEach(namespace => {
          namespace.to(room).emit(event, ...args);
        });
      },
    };
  }
}
//#endregion

//#region ipc renderer namespace
export class IpcRendererNamespace {
  ipcRenderer!: typeof ipcRenderer;
  private listeners: RendererEventListeners = {};

  constructor(public name: string) {
    this.ipcRenderer = (window as any).require('electron').ipcRenderer;
  }

  on(eventName: string, callback: (event: any, ...args: any[]) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
    const listenToEvent = `(${this.name}) "${eventName}"`;
    // console.log(`[BROWSSER]][IPC][NAMESPACE] listenToEvent "${listenToEvent}"`);
    this.ipcRenderer.on(listenToEvent, (e, data) => {
      callback(data);
    });
    if (eventName === 'connect') {
      this.emit('connection');
    } else {
      this.emit(eventName);
    }
  }

  off(event: string, callback?: (event: any, ...args: any[]) => void) {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(
        listener => listener !== callback,
      );
    } else {
      delete this.listeners[event];
    }
    const removeListener = `(${this.name}) "${event}"`;
    // console.log({ 'this.contextName': this.contextName });
    // console.log(
    //   `[BROWSSER]][IPC][NAMESPACE] removeListener "${removeListener}"`,
    // );
    this.ipcRenderer.removeListener(removeListener, callback);
  }

  emit(event: string, ...args: any[]) {
    const emitEvent = `(${this.name}) "${event}"`;
    // console.log({ 'this.contextName': this.contextName });
    // console.log(`[BROWSSER]][IPC][NAMESPACE] emitEvent: "${emitEvent}"`);
    this.ipcRenderer.send(emitEvent, ...args);
  }
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
  //#endregion
}
