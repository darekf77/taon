import { IpcRendererNamespace } from './realtime-strategy-ipc-renderer-namespace';

export class IpcRendererWrapper {
  private namespaces: { [namespace: string]: IpcRendererNamespace } = {
    '/': new IpcRendererNamespace('/', this.contextName),
  };

  constructor(public contextName: string) {}

  of(namespace: string): IpcRendererNamespace {
    if (!this.namespaces[namespace]) {
      this.namespaces[namespace] = new IpcRendererNamespace(
        namespace,
        this.contextName,
      );
    }
    return this.namespaces[namespace];
  }

  on(event: string, callback: (event: any, ...args: any[]) => void) {
    this.namespaces['/'].on(event, callback);
  }

  emit(event: string, ...args: any[]) {
    this.namespaces['/'].emit(event, ...args);
  }
}
