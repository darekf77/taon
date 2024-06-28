import { IpcMainNamespace } from './realtime-strategy-ipc-main-namespace';
import { Namespaces } from './realtime-strategy-ipc.models';

export class ioIpcStrategy {
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
