import { ipcRenderer } from 'electron';

import { RendererEventListeners } from './realtime-strategy-ipc.models';
import { Helpers } from 'tnp-core/src';

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
    this.ipcRenderer.on(listenToEvent, callback);
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
