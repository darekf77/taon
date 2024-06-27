import { IpcNamespace } from "./realtime-strategy-ipc-namespace";
import { Namespaces } from "./realtime-strategy-ipc.models";

export class ioIpcStrategy {
 private namespaces: Namespaces = {
    '/': new IpcNamespace('/', this.contextName)
  };

  constructor(public contextName: string) {}

  of(namespace: string): IpcNamespace {
    if (!this.namespaces[namespace]) {
      this.namespaces[namespace] = new IpcNamespace(namespace, this.contextName);
    }
    return this.namespaces[namespace];
  }

  on(event: string, callback: (event: Electron.IpcMainEvent, ...args: any[]) => void) {
    this.namespaces['/'].on(event, callback);
  }

  emit(event: string, ...args: any[]) {
    this.namespaces['/'].emit(event, ...args);
  }

}
