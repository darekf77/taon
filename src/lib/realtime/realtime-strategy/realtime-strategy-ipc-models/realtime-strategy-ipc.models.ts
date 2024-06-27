import { IpcNamespace } from './realtime-strategy-ipc-namespace';

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
  [namespace: string]: IpcNamespace;
}
