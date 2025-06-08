import { CoreModels } from 'tnp-core/src';
import { Response, RequestHandler } from 'express';
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import { _ } from 'tnp-core/src';
import { Models as ModelsNg2Rest } from 'ng2-rest/src';
import { ClassHelpers } from './helpers/class-helpers';
import type { TaonControllerOptions } from './decorators/classes/controller-decorator';
import type { TaonEntityOptions } from './decorators/classes/entity-decorator';

export namespace Models {
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
  }

  export const ClassTypeKey = {
    [ClassType.ENTITY]: 'entities',
    [ClassType.CONTROLLER]: 'controllers',
    [ClassType.REPOSITORY]: 'repositories',
    [ClassType.PROVIDER]: 'providers',
    [ClassType.SUBSCRIBER]: 'subscribers',
    [ClassType.MIGRATION]: 'migrations',
  } as {
    [key in ClassType]: keyof ContextOptions<any, any, any, any, any, any, any>;
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
  };
  export interface ContextOptions<
    CONTEXTS,
    CONTROLLERS,
    ENTITIES,
    REPOSITORIES,
    PROVIDERS,
    SUBSCRIBERS,
    MIGRATIONS,
  > {
    appId: string;

    contextName: string;
    /**
     * host/port for initing backend server
     */
    host?: string;
    /**
     * frontend host only needed when we are
     * using withCredentials for axios
     * and session cookie
     * or realtime communication
     */
    frontendHost?: string;
    /**
     * backend way of communication
     * between taon backends/processes
     */
    remoteHost?: string;
    /**
     * User ipc for communication between BE/FE
     * when electron is used as a platform
     * Default: true
     */
    useIpcWhenElectron?: boolean;
    contexts?: CONTEXTS;
    controllers?: CONTROLLERS;
    entities?: ENTITIES;
    repositories?: REPOSITORIES;
    providers?: PROVIDERS;
    subscribers?: SUBSCRIBERS;
    migrations?: MIGRATIONS;
    session?: ISession;
    skipWritingServerRoutes?: boolean;
    productionMode?: boolean;
    abstract?: boolean;
    logs?: boolean | ConnectionOptionsLogs;
    database?: boolean | Partial<DatabaseConfig>;
    disabledRealtime?: boolean;
    https?: {
      key: string;
      cert: string;
    };
    publicAssets?: { serverPath: string; locationOnDisk: string }[];
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
      received?: Rest.PromiseObservableMix<Rest.HttpResponse<T>>;
    }

    export interface AsyncResponse<T> {
      (
        req?: ExpressRequest,
        res?: ExpressResponse,
      ): Promise<SyncResponse<T> | SyncResponseFunc<T>>;
    }

    export type Response<T = string> = AsyncResponse<T> & ClientAction<T>;

    export class Errors {
      public toString = (): string => {
        return this.message;
      };

      private constructor(
        public message: string,
        private code: ModelsNg2Rest.HttpCode = 400,
      ) {}

      private static create(
        message: string,
        code: ModelsNg2Rest.HttpCode = 400,
      ) {
        return new Errors(message, code);
      }

      public static entityNotFound(entity?: Function) {
        return Errors.create(
          `Entity ${ClassHelpers.getName(entity)} not found`,
        );
      }

      public static custom(
        message: string,
        code: ModelsNg2Rest.HttpCode = 400,
      ) {
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

  //#region models / start params
  export interface StartParams {
    port: number;
    args: string[];
    onlyMigrationRun?: boolean;
    onlyMigrationRevertToTimestamp?: number;
  }

  //#endregion
}
