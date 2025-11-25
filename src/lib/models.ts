import type { RequestHandler } from 'express';
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import {
  Models as ModelsNg2Rest,
  RestErrorResponseWrapper,
  RestResponseWrapper,
} from 'ng2-rest/src';
import { _ } from 'tnp-core/src';
import { CoreModels } from 'tnp-core/src';

import { TaonBaseClass } from './base-classes/base-class';
import type { TaonBaseMiddleware } from './base-classes/base-middleware';
import type {
  TaonHttpDecoratorOptions,
  TaonMiddlewareFunction,
  TaonMiddlewareInheritanceObj,
} from './decorators/http/http-methods-decorators';
import type { EndpointContext } from './endpoint-context';
import { ClassHelpers } from './helpers/class-helpers';

// ! TODO make it as a nice way to wrap normal request
export class TaonRestResponseWrapper extends RestResponseWrapper {}

export const BaseTaonClassesNames = [
  'BaseCrudController',
  'BaseController',
  'BaseAbstractEntity',
  'BaseEntity',
  'BaseContext',
  'BaseCustomRepository',
  'BaseFileUploadMiddleware',
  'BaseMiddleware',
  'BaseClass',
  'BaseInjector',
  'BaseMigration',
  'BaseProvider',
  'BaseRepository',
  'BaseSubscriberForEntity',
  'BaseCliWorkerController',
  'PortsController',
  'PortsContext',
] as const;

export namespace Models {
  export const DatabasesFolder = 'databases';
  export type FrameworkMode =
    | 'backend-frontend(tcp+udp)'
    | 'remote-backend(tcp+udp)'
    | 'backend-frontend(ipc-electron)'
    | 'backend-frontend(websql-electron)'
    | 'backend-frontend(websql)';

  //#region models / class types
  export enum ClassType {
    ENTITY = 'ENTITY',
    CONTROLLER = 'CONTROLLER',
    REPOSITORY = 'REPOSITORY',
    PROVIDER = 'PROVIDER',
    SUBSCRIBER = 'SUBSCRIBER',
    MIGRATION = 'MIGRATION',
    MIDDLEWARE = 'MIDDLEWARE',
  }

  export const ClassTypeKey = {
    [ClassType.ENTITY]: 'entities',
    [ClassType.CONTROLLER]: 'controllers',
    [ClassType.REPOSITORY]: 'repositories',
    [ClassType.PROVIDER]: 'providers',
    [ClassType.SUBSCRIBER]: 'subscribers',
    [ClassType.MIGRATION]: 'migrations',
    [ClassType.MIDDLEWARE]: 'middlewares',
  } as {
    [key in ClassType]: keyof ContextOptions<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >;
  };

  //#endregion

  //#region models / middleware type
  export type MiddlewareType = [Function, any[]];
  //#endregion

  //#region models / db recreate mode
  /**
   * DROP_DB+MIGRATIONS (default for development)
   * Drop all tables + recreate them + run migrations
   * synchronize: true , dropSchema: true
   * use migrations: true
   *
   * MIGRATIONS (default for production)
   * Do not drop tables, only run migrations
   * synchronize: false, dropSchema: false
   * use migrations: true
   */
  export type DBRecreateMode =
    | 'DROP_DB+MIGRATIONS'
    | 'PRESERVE_DATA+MIGRATIONS';
  //#endregion

  //#region models / database connection options
  export class DatabaseConfigTypeOrm {
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
    /**
     * Persists db on disk/local-storage if serverless db
     */
    autoSave?: boolean;
    /**
     * for websql db mode
     * true by default
     */
    useLocalForage?: boolean;
    logging: boolean;
    databasePort?: number;
    databaseHost?: string;
    databaseUsername?: string;
    databasePassword?: string;
  }
  //#endregion

  //#region models / database config
  export class DatabaseConfig extends DatabaseConfigTypeOrm {
    /**
     * Default value 'DROP_ALL'.
     *
     * Tell framework what is happening with db
     * when context is starting.
     */
    public recreateMode?: DBRecreateMode;

    static from(
      databasePartialConfig: Partial<
        Omit<
          DatabaseConfig,
          'synchronize' | 'dropSchema' | 'databaseConfigTypeORM'
        >
      >,
    ): DatabaseConfig {
      return _.merge(new DatabaseConfig(), databasePartialConfig);
    }

    get databaseConfigTypeORM(): DatabaseConfigTypeOrm {
      //#region @websqlFunc
      const result = _.cloneDeep(this) as DatabaseConfig;
      if (result.recreateMode) {
        if (result.recreateMode === 'DROP_DB+MIGRATIONS') {
          result.synchronize = true;
          result.dropSchema = true;
        } else if (result.recreateMode === 'PRESERVE_DATA+MIGRATIONS') {
          result.synchronize = false;
          result.dropSchema = false;
        }
      }
      delete result.recreateMode;

      return result as any;
      //#endregion
    }
  }
  //#endregion

  //#region models / session

  export type ISession = {
    secret?: string;
    saveUninitialized?: boolean;
    /**
     * max age of session
     */
    cookieMaxAge?: number;
    secure?: boolean;
    resave?: boolean;
  };
  //#endregion

  //#region models / context options
  export type ConnectionOptionsLogs = {
    http?: boolean;
    realtime?: boolean;
    framework?: boolean;
    db?: boolean;
    migrations?: boolean;
    routes?: boolean;
  };
  export interface ContextOptions<
    CONTEXTS,
    CONTROLLERS,
    ENTITIES,
    REPOSITORIES,
    PROVIDERS,
    SUBSCRIBERS,
    MIGRATIONS,
    MIDDLEWARES,
  > {
    appId?: string;

    contextName: string;
    /**
     * if defined and different from contextName
     * - context will NOT be initialized
     */
    activeContext?: string | null;
    /**
     * IMPORTANT! provide full url that starts with http:// or https://
     * host/port for initing backend server
     */
    host?: string;

    /**
     * Needs to be specified in docker environment only
     */
    hostPortNumber?: number;
    /**
     * IMPORTANT! provide full url that starts with http:// or https://
     * frontend host only needed when we are
     * using withCredentials for axios
     * and session cookie
     * or realtime communication
     */
    frontendHost?: string;

    /**
     * Needs to be specified in docker environment only
     */
    frontendHostPortNumber?: number;

    /**
     * User ipc for communication between BE/FE
     * when electron is used as a platform
     * Default: true
     */
    useIpcWhenElectron?: boolean;
    /**
     * taon contexts here
     * (module like structure)
     */
    contexts?: CONTEXTS;
    /**
     * taon controller here
     * (glue between frontend and backend)
     */
    controllers?: CONTROLLERS;
    /**
     * taon entities
     * (entities are used to create tables in db)
     */
    entities?: ENTITIES;
    /**
     * taon repositories
     * (repositories are used to access data from db)
     */
    repositories?: REPOSITORIES;
    /**
     * taon providers
     * (context singletons)
     */
    providers?: PROVIDERS;
    /**
     * taon subscribers
     * (subscribers are used to listen to db events)
     */
    subscribers?: SUBSCRIBERS;
    /**
     * taon migrations
     * (migrations are used to update db schema and achieve proper CI/CD)
     */
    migrations?: MIGRATIONS;
    /**
     * taon middlewares
     * middlewares are used to intercept requests
     * and responses in the context
     */
    middlewares?: MIDDLEWARES;
    /**
     * Config for express session
     */
    session?: ISession;
    /**
     * taon is not going to write .rest files to cwd()
     */
    skipWritingServerRoutes?: boolean;
    /**
     * TODO - this is still in progress
     * @deprecated
     */
    productionMode?: boolean;
    /**
     * If you want your context to never be started as separated server
     * use abstract: true
     * @default: false
     */
    abstract?: boolean;
    logs?: boolean | ConnectionOptionsLogs;
    database?: boolean | Partial<DatabaseConfig>;
    /**
     * disable default realtime communication through TCP upgrade sockets
     */
    disabledRealtime?: boolean;
    /**
     * Will be removed soon - cloud will handle certs and https
     * @deprecated
     */
    https?: {
      key: string;
      cert: string;
    };
    /**
     * TODO - will be removed soon
     * @deprecated
     */
    publicAssets?: { serverPath: string; locationOnDisk: string }[];
    /**
     * by default cwd === process.cwd()
     */
    cwd?: string;
  }
  //#endregion

  //#region models / http
  export namespace Http {
    export import Rest = ModelsNg2Rest;

    export type ContextENDPOINT = { target: Function; initFN: Function };

    export type FormlyFromType = 'material' | 'bootstrap';

    export type ExpressContext<T> = (
      req: ExpressRequest,
      res: ExpressResponse,
    ) => T;

    export type SyncResponse<T> = string | T;

    export type ResponseFuncOpt<T> = {
      limitSize?: (
        enties: Function | Function[],
        include: string[],
        exclude: string[],
      ) => void;
    };

    export type SyncResponseFunc<T> = (
      options?: ResponseFuncOpt<T>,
    ) => SyncResponse<T>;
    export type MixResponse<T> = SyncResponse<T> | ExpressContext<T>;

    export interface ClientAction<T> {
      /**
       * @deprecated use request() mehods instead
       */
      readonly received?: Rest.PromiseObservableMix<Rest.HttpResponse<T>>;
      request?(
        axiosConfig?: ModelsNg2Rest.Ng2RestAxiosRequestConfig,
      ): Rest.PromiseObservableMix<Rest.HttpResponse<T>>;
    }

    export interface AsyncResponse<T> {
      (
        req?: ExpressRequest,
        res?: ExpressResponse,
      ): Promise<SyncResponse<T> | SyncResponseFunc<T>>;
    }

    export type Response<T = string> = AsyncResponse<T> & ClientAction<T>;

    //#region @websql
    export interface AuthCallBack {
      (methodReference: Function): RequestHandler;
    }

    //#endregion
  }
  //#endregion

  //#region models / start params
  export interface StartParams {
    port: number;
    args: string[];
    onlyMigrationRun?: boolean;
    onlyMigrationRevertToTimestamp?: number;
  }

  export interface TaonInitializeParams {
    onlyMigrationRun?: boolean;
    onlyMigrationRevertToTimestamp?: number;
  }

  export interface TaonCtxCloneParams {
    useAsRemoteContext?: boolean;
    overrideRemoteHost?: string;
    overrideHost?: string;
    sourceContext?: EndpointContext;
  }

  //#endregion
}
