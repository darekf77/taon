
import { isBrowser, isNode } from "ng2-logger";
import { Socket } from 'socket.io'

//#region @backend
import { Server } from 'socket.io'
import { Connection } from 'typeorm';
import { Application } from "express";

//#endregion

export class Global {

  public get socket() {
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
      //#region @backend
      set BE(v) {
        self.socketBackend = v;
      },
      get BE() {
        return self.socketBackend;
      }
      //#endregion
    }
  }
  public expressPath: string;
  public url: URL;
  public urlSocket: URL;
  public productionMode = false;
  public controllers: Function[] = []
  public __core_controllers: Function[] = []
  public entities: Function[] = []
  public __core_entities: Function[] = []
  public initFunc: { initFN: Function, target: Function }[] = [];
  private socketFrontEnd: Socket;
  public allowedHosts: URL[] = [];

  //#region @backend
  private socketBackend: Server;
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
