import { IpcRendererNamespace } from './realtime-strategy-ipc-renderer-namespace';

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
      this.namespaces[namespace] = new IpcRendererNamespace(
        namespace
      );
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
