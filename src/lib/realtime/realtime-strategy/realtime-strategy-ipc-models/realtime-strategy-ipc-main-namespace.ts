import { EventListeners, Rooms } from './realtime-strategy-ipc.models';
//#region @backend
import * as Electron from 'electron';
import { ipcMain } from 'electron';
//#endregion

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
