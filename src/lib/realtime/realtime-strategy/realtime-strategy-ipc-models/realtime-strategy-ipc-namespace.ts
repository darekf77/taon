import { EventListeners, Rooms } from './realtime-strategy-ipc.models';
//#region @backend
import { ipcMain } from 'electron';
//#endregion

export class IpcNamespace {
  private rooms: Rooms = {};
  private listeners: EventListeners = {};

  constructor(
    public name: string,
    public contextName: string,
  ) {}

  on(
    event: string,
    callback: (event: Electron.IpcMainEvent, ...args: any[]) => void,
  ) {
    //#region @backendFunc
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    ipcMain.on(`${this.contextName}:${this.name}:${event}`, callback);
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
    ipcMain.removeListener(
      `${this.contextName}:${this.name}:${event}`,
      callback,
    );
    //#endregion
  }

  emit(event: string, ...args: any[]) {
    this.rooms['default'].forEach(webContents => {
      webContents.send(`${this.contextName}:${this.name}:${event}`, ...args);
    });
  }

  to(room: string) {
    return {
      emit: (event: string, ...args: any[]) => {
        if (this.rooms[room]) {
          this.rooms[room].forEach(webContents => {
            webContents.send(
              `${this.contextName}:${this.name}:${event}`,
              ...args,
            );
          });
        }
      },
    };
  }

  joinRoom(webContents: Electron.WebContents, room: string) {
    if (!this.rooms[room]) {
      this.rooms[room] = new Set();
    }
    this.rooms[room].add(webContents);
  }

  leaveRoom(webContents: Electron.WebContents, room: string) {
    if (this.rooms[room]) {
      this.rooms[room].delete(webContents);
      if (this.rooms[room].size === 0) {
        delete this.rooms[room];
      }
    }
  }
}
