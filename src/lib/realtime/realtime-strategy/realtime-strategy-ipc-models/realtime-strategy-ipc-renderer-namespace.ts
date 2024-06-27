//#region @backend
import { ipcRenderer } from 'electron';
//#endregion
import { RendererEventListeners } from './realtime-strategy-ipc.models';

export class IpcRendererNamespace {
  private listeners: RendererEventListeners = {};

  constructor(public name: string, public contextName: string) {}

  on(event: string, callback: (event: any, ...args: any[]) => void) {
    //#region @backendFunc
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    ipcRenderer.on(`${this.contextName}:${this.name}:${event}`, callback);
    //#endregion
  }

  off(event: string, callback?: (event: any, ...args: any[]) => void) {
    //#region @backendFunc
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(listener => listener !== callback);
    } else {
      delete this.listeners[event];
    }
    ipcRenderer.removeListener(`${this.contextName}:${this.name}:${event}`, callback);
    //#endregion
  }

  emit(event: string, ...args: any[]) {
    //#region @backendFunc
    ipcRenderer.send(`${this.contextName}:${this.name}:${event}`, ...args);
    //#endregion
  }
}
