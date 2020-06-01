import { Socket } from 'socket.io'
import { Helpers } from './helpers';
import { Models } from 'typescript-class-helpers';
import { StartOptions } from './framework/framework-start';

//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import { Server, Namespace } from 'socket.io'
import { Connection } from 'typeorm';
import { Application } from 'express';
//#endregion

export class Global {

  public get socketNamespace() {
    const self = this;
    return {
      set FE(v) {
        if (!Helpers.isBrowser) {
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
        if (!Helpers.isBrowser) {
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

  private _isProductionModeAlreadySet = false;
  private _isProductionMode = false;
  public get isProductionMode() {
    return this._isProductionMode;
  }

  public set isProductionMode(v: boolean) {
    if (!this._isProductionModeAlreadySet) {
      this._isProductionModeAlreadySet = true;
    } else {
      throw `[Morphi] production mode already set`
    }
    this._isProductionMode = v;
  }

  public url: URL;
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
  public activeRoutes: { routePath: string; method: Models.HttpMethod }[] = []

  public writeActiveRoutes() {
    const routes = this.activeRoutes.map(({ method, routePath }) => {
      return `${method.toUpperCase()}:    ${routePath}`
    })
    fse.writeJSONSync(path.join(process.cwd(), 'tmp-routes.json'), routes, {
      spaces: 2,
      encoding: 'utf8'
    })
  }
  private socketNamespaceBE: Server;
  private socketNamespaceBERealtime: Namespace;
  public clientsSockets: Map<string, Socket>;
  public app: Application;
  public onlyForBackendRemoteServerAccess = false;
  public connection: Connection;
  public startOptions: StartOptions;
  //#endregion


  public static vars = new Global();


  private get(key) {

    //#region @backend
    if (Helpers.isNode) {
      return global[key];
    }
    //#endregion
    if (Helpers.isBrowser) {
      return window[key];
    }
  }

  private set(value, key) {
    //#region @backend
    if (Helpers.isNode) {
      global[key] = value;
    }
    //#endregion
    if (Helpers.isBrowser) {
      window[key] = value;
    }
  }

}
