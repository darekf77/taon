import { CoreModels } from "tnp-core/src";
import { Response, RequestHandler } from 'express';
import { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { Models as ModelsNg2Rest } from 'ng2-rest/src';
import { ClassHelpers } from "./helpers/class-helpers";
import type { FiredevControllerOptions } from "./decorators/classes/controller-decorator";
import type { FiredevEntityOptions } from "./decorators/classes/entity-decorator";


export namespace Models {

  export type FrameworkMode =
    'backend-frontend(tcp+udp)' |
    'remote-backend(tcp+udp)' |
    'backend-frontend(ipc-electron)' |
    'backend-frontend(websql)'
    ;

  //#region models / class types
  export enum ClassType {
    ENTITY = 'ENTITY', CONTROLLER = 'CONTROLLER', REPOSITORY = 'REPOSITORY', PROVIDER = 'PROVIDER'
  }

  export const ClassTypeKey = {
    [ClassType.ENTITY]: 'entities',
    [ClassType.CONTROLLER]: 'controllers',
    [ClassType.REPOSITORY]: 'repositories',
    [ClassType.PROVIDER]: 'providers',
  } as { [key in ClassType]: keyof ContextOptions<any, any, any, any, any>; };

  //#endregion

  //#region models / middleware type
  export type MiddlewareType = [Function, any[]];
  //#endregion

  //#region models / database connection options
  export interface DatabaseConfig {
    /**
     * database name
     */
    database?: string;
    /**
     * only for file base db: sqlite, sqljs
     */
    location?: string;
    synchronize: boolean;
    dropSchema: boolean;
    type?: CoreModels.DatabaseType;

    autoSave: boolean; // TODO what is this ?
    /**
     * for websql db mode
     */
    useLocalForage?: boolean;
    logging: boolean;

    databasePort?: number;
    databaseHost?: string;
    databaseUsername?: string,
    databasePassword?: string,
  }
  //#endregion

  //#region models / session

  export type ISession = {
    /**
       * frontend host only needed when we are using
       * withCredentials for axios
       * and session cookie
       */
    frontendHost?: string;
    secret?: string,
    saveUninitialized?: boolean,
    /**
       * max age of session
       */
    cookieMaxAge?: number;
    secure?: boolean;
    resave?: boolean;
  }
  //#endregion

  //#region models / context options
  export interface ContextOptions<CONTEXTS, CONTROLLERS, ENTITIES, REPOSITORIES, PROVIDERS> {
    contextName: string;
    host?: string;
    remoteHost?: string;
    useIpcWhenElectron?: boolean;
    contexts?: CONTEXTS;
    controllers?: CONTROLLERS;
    entities?: ENTITIES;
    repositories?: REPOSITORIES;
    providers?: PROVIDERS;
    session?: ISession;
    productionMode?: boolean;
    abstract?: boolean;
    /**
     * Display server logs (default true for development mode, false for production mode)
     */
    serverLogs?: boolean;
    database?: boolean | DatabaseConfig;
    disabledRealtime?: boolean;
    https?: {
      key: string;
      cert: string;
    };
    publicAssets?: { serverPath: string; locationOnDisk: string; }[];
    middlewares?: MiddlewareType[];

  }
  //#endregion


  //#region models / decorator abstract options
  export class DecoratorAbstractOpt {
    className: string;
  }
  //#endregion

  //#region models / param config
  export class ParamConfig {
    paramName: string;
    paramType: CoreModels.ParamType;
    index: number;
    defaultType: any;
    expireInSeconds?: number;
  }
  //#endregion

  //#region models / method config
  export class MethodConfig {
    methodName: string;
    /**
     * path is global in express app
     */
    global?: boolean;
    /**
     * override default content type
     */
    contentType?: any;
    /**
     * override default axiso response type
     */
    responseType?: any;
    path: string;
    descriptor: PropertyDescriptor;
    type: CoreModels.HttpMethod;
    //#region @websql
    requestHandler: any;
    //#endregion
    parameters: { [paramName: string]: ParamConfig } = {};
  }
  //#endregion

  //#region models / controller config
  export class ControllerConfig extends DecoratorAbstractOpt {

    realtime?: boolean;
    path: string;
    uniqueKey?: string;
    methods: { [methodName: string]: MethodConfig } = {};
  }
  //#endregion

  //#region models / runtime controller config
  export class RuntimeControllerConfig extends ControllerConfig {
    calculatedPath?: string;
    browserTransformFn?: (entity: any) => any;
  }
  //#endregion



  //#region models / http
  export namespace Http {

    export import Rest = ModelsNg2Rest;

    export type ContextENDPOINT = { target: Function; initFN: Function; };

    export type FormlyFromType = 'material' | 'bootstrap';


    export type ExpressContext<T> = (req: ExpressRequest, res: ExpressResponse) => T;

    export type SyncResponse<T> = string | T;

    export type ResponseFuncOpt<T> = {
      limitSize?: (enties: Function | Function[], include: string[], exclude: string[]) => void;
    }

    export type SyncResponseFunc<T> = (options?: ResponseFuncOpt<T>) => SyncResponse<T>;
    export type MixResponse<T> = SyncResponse<T> | ExpressContext<T>;

    export interface ClientAction<T> {
      received?: Rest.PromiseObservableMix<Rest.HttpResponse<T>>;
    }

    export interface __Response<T> {
      //#region @websql
      send?: MixResponse<T>;
      //#endregion
    }

    export interface AsyncResponse<T> {
      (req?: ExpressRequest, res?: ExpressResponse): Promise<SyncResponse<T> | SyncResponseFunc<T>>;
    }

    export type Response<T = string> = (__Response<T> | AsyncResponse<T>) & ClientAction<T> & __Response<T>;

    export class Errors {

      public toString = (): string => {
        return this.message
      }

      private constructor(public message: string, private code: ModelsNg2Rest.HttpCode = 400) {

      }

      private static create(message: string, code: ModelsNg2Rest.HttpCode = 400) {
        return new Errors(message, code);
      }

      public static entityNotFound(entity?: Function) {
        return Errors.create(`Entity ${ClassHelpers.getName(entity)} not found`);
      }

      public static custom(message: string, code: ModelsNg2Rest.HttpCode = 400) {
        return Errors.create(message, code);
      }

    }

    //#region @websql
    export interface AuthCallBack {
      (methodReference: Function): RequestHandler;
    }

    //#endregion

  }
  //#endregion


}


