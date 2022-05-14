import type { BASE_CONTROLLER } from './framework-controller';
import type { BASE_ENTITY } from './framework-entity';
import { ConfigModels } from 'tnp-config';


export interface IConnectionOptions {
  database: string;
  type: ConfigModels.DatabaseType;
  synchronize: boolean;
  dropSchema: boolean;
  logging: boolean;
}

export type ISession = {
  /**
     * frontend host only needed when we are using
     * withCredentials for axios
     * and session cookie
     */
  frontendHost: string;
  secret: string,
  saveUninitialized: boolean,
  cookie: {
    maxAge: number,
    /**
     * true only for https, false fopr the rest
     * when is true and http => everytime new session
     */
    secure: boolean
  },
  resave: boolean,
}

export type ISessionExposed = {
  /**
   * REQUIRED - backend need to know that to negotiate credentials
   * frontend host only needed when we are using
   * withCredentials for axios
   * and session cookie
   */
  frontendHost: string;
  /**
   * max age of session
   */
  maxAge?: number;
}

export type MiddlewareType = [Function, any[]];

export type FrameworkMode = 'backend/frontend' |
  'remote-backend' |
  'tests' |
  'backend/frontend-worker'
  ;

export interface StartOptions {

  /**
   * start server on this host
   */
  host: string;

  controllers?: BASE_CONTROLLER<any>[] | Function[];
  entities?: BASE_ENTITY<any>[] | Function[];
  disabledRealtime?: boolean;
  allowedHosts?: string[];
  session?: ISessionExposed;

  //#region @backend
  mode?: FrameworkMode;
  config?: IConnectionOptions;
  middlewares?: MiddlewareType[];
  InitDataPrioritypublicAssets?: { path: string; location: string }[];
  InitDataPriority?: BASE_CONTROLLER<any>[] | Function[];
  publicAssets?: { path: string; location: string; }[];
  //#endregion

}

