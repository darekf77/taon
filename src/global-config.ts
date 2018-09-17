
import { isBrowser, isNode } from "ng2-logger";
import { Socket } from 'socket.io'

//#region @backend
import { Server, Namespace } from 'socket.io'
import { Connection } from 'typeorm';
import { Application } from "express";

//#endregion

export class Global {

  public get socketNamespace() {
    const self = this;
    return {
      set FE(v) {
        if (!isBrowser) {
          //#region @backend
          console.trace(`CANNOT USE frontend socket on backend side.`)
          process.exit(1)
          //#endregion
        }
        self.socketFrontEnd = v;
      },
      get FE() {
        return self.socketFrontEnd;
      },
      set FE_REALTIME(v) {
        if (!isBrowser) {
          //#region @backend
          console.trace(`CANNOT USE frontend socket on backend side.`)
          process.exit(1)
          //#endregion
        }
        self.socketFrontEndRealtime = v;
      },
      get FE_REALTIME() {
        return self.socketFrontEndRealtime;
      },
      //#region @backend
      set BE(v) {
        self.socketNamespaceBE = v;
      },
      get BE() {
        return self.socketNamespaceBE;
      },
      set BE_REALTIME(v) {
        self.socketNamespaceBERealtime = v;
      },
      get BE_REALTIME() {
        return self.socketNamespaceBERealtime;
      }
      //#endregion
    }
  }
  public expressPath: string;
  public url: URL;
  public urlSocket: URL;
  public productionMode = false;
  public ngZone: any;
  public ApplicationRef: any;
  public controllers: Function[] = []
  public __core_controllers: Function[] = []
  public entities: Function[] = []
  public __core_entities: Function[] = []
  public initFunc: { initFN: Function, target: Function }[] = [];
  private socketFrontEnd: Socket;
  private socketFrontEndRealtime: Socket;
  public allowedHosts: URL[] = [];

  //#region @backend
  private socketNamespaceBE: Server;
  private socketNamespaceBERealtime: Namespace;
  public clientsSockets: Map<string, Socket>;
  public app: Application;
  public connection: Connection;
  //#endregion


  public static vars = new Global();


  private get(key) {

    //#region @backend
    if (isNode) {
      return global[key];
    }
    //#endregion
    if (isBrowser) {
      return window[key];
    }
  }

  private set(value, key) {
    //#region @backend
    if (isNode) {
      global[key] = value;
    }
    //#endregion
    if (isBrowser) {
      window[key] = value;
    }
  }

}
