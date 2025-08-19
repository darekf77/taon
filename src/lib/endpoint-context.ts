//#region imports
import type { Server } from 'http';
import { Http2Server } from 'http2'; // @backend
import { URL } from 'url'; // @backend

import type { NgZone } from '@angular/core'; // @browser
import axios from 'axios';
import * as bodyParser from 'body-parser'; // @backend
import * as cookieParser from 'cookie-parser'; // @backend
import * as cors from 'cors'; // @backend
import { ipcMain } from 'electron'; // @backend
import * as express from 'express';
import type { Application } from 'express';
//  multer in taon middleware will do better job than express-fileupload
// import * as fileUpload from 'express-fileupload'; // @backend
import * as expressSession from 'express-session'; // @backend
import { JSON10 } from 'json10/src';
import { walk } from 'lodash-walk-object/src';
import * as methodOverride from 'method-override'; // @backend
import {
  Mapping,
  Models as ModelsNg2Rest,
  Resource,
  RestHeaders,
} from 'ng2-rest/src';
import { from, Subject } from 'rxjs';
import type {
  TransactionRollbackEvent,
  TransactionCommitEvent,
  TransactionStartEvent,
  RecoverEvent,
  SoftRemoveEvent,
  RemoveEvent,
  UpdateEvent,
  InsertEvent,
  Repository,
} from 'taon-typeorm/src'; // @websql
import { EventSubscriber } from 'taon-typeorm/src'; // @websql
import { Entity as TypeormEntity, Tree } from 'taon-typeorm/src'; // @websql
import {
  DataSource,
  DataSourceOptions,
  getMetadataArgsStorage,
} from 'taon-typeorm/src';
import { fse, http, https, os } from 'tnp-core/src'; // @backend
import { UtilsOs, Utils } from 'tnp-core/src';
import { crossPlatformPath } from 'tnp-core/src';
import { _, Helpers } from 'tnp-core/src';
import { path } from 'tnp-core/src';

import type { BaseClass } from './base-classes/base-class';
import type { BaseInjector } from './base-classes/base-injector';
import type { BaseMiddleware } from './base-classes/base-middleware';
import type { BaseMigration } from './base-classes/base-migration';
import { BaseSubscriberForEntity } from './base-classes/base-subscriber-for-entity';
import { apiPrefix } from './constants';
import { ContextDbMigrations } from './context-db-migrations';
import { createContext } from './create-context';
import type { ControllerConfig } from './decorators/classes/controller-config';
import { TaonEntityOptions } from './decorators/classes/entity-decorator';
import { TaonSubscriberOptions } from './decorators/classes/subscriber-decorator';
import { DITaonContainer } from './dependency-injection/di-container';
import { EntityProcess } from './entity-process';
import { getResponseValue } from './get-response-value';
import { ClassHelpers } from './helpers/class-helpers';
import { TaonHelpers } from './helpers/taon-helpers';
import { Models } from './models';
import { RealtimeCore } from './realtime/realtime-core';
import { Symbols } from './symbols';
import { TaonAdminService } from './ui/taon-admin-mode-configuration/taon-admin.service'; // @browser
//#endregion

export class EndpointContext {
  //#region static

  /**
   * JUST FOR TESTING PURPOSES
   */
  public readonly USE_MARIADB_MYSQL_IN_DOCKER: boolean = false;

  //#region @browser
  private static ngZone: NgZone;
  //#endregion

  //#region @browser
  static initNgZone(ngZone: NgZone): void {
    //#region @browser
    this.ngZone = ngZone;
    //#endregion
  }
  //#endregion

  // public static findForTraget(classFnOrObject: any): EndpointContext {
  //   const obj = ClassHelpers.getClassFnFromObject(classFnOrObject) || {};
  //   return (
  //     classFnOrObject[Symbols.ctxInClassOrClassObj] ||
  //     obj[Symbols.ctxInClassOrClassObj]
  //   );
  // }
  //#endregion

  //#region fields

  //#region fields / flags
  disabledRealtime: boolean = false;
  /**
   * check whether context is inited
   * (with init() function )
   */
  public inited: boolean = false;
  //#endregion

  readonly dbMigrations = new ContextDbMigrations(this);

  private readonly localInstaceObjSymbol = Symbol('localInstaceObjSymbol');

  //#region fields / all instances of classes from context
  /**
   * all instances of classes from context
   * key is class name
   */
  public readonly allClassesInstances = {};
  //#endregion

  //#region fields / class instances by name
  private readonly classInstancesByNameObj = {};
  //#endregion

  //#region fields / obj with classes instances arr
  private readonly objWithClassesInstancesArr = {};
  //#endregion

  //#region fields / active routes
  public readonly activeRoutes: {
    expressPath: string;
    method: Models.Http.Rest.HttpMethod;
  }[] = [];
  //#endregion

  //#region fields / typeorm repositories
  //#region @websql
  public repos = new Map<string, Repository<any>>();
  //#endregion
  //#endregion

  public readonly skipWritingServerRoutes: boolean = false;

  //#region fields / types from contexts
  private injectableTypesfromContexts = [
    Models.ClassType.CONTROLLER,
    Models.ClassType.PROVIDER,
    Models.ClassType.MIDDLEWARE,
    Models.ClassType.REPOSITORY,
    Models.ClassType.SUBSCRIBER,
    Models.ClassType.MIGRATION,
  ];
  //#endregion

  private allTypesfromContexts = [
    ...this.injectableTypesfromContexts,
    Models.ClassType.ENTITY,
  ];

  // public __contextForControllerInstanceAccess?: EndpointContext;

  //#region fields / express app
  public expressApp: Application = {} as any;
  //#endregion

  //#region fields / server tcp udp
  public serverTcpUdp: Server;
  //#endregion

  //#region fields / database config
  databaseConfig?: Models.DatabaseConfigTypeOrm;
  //#endregion

  //#region fields /  mode
  mode: Models.FrameworkMode;
  //#endregion

  //#region fields / only migration start
  readonly onlyMigrationRun?: boolean = false;
  readonly onlyMigrationRevertToTimestamp?: number = undefined;

  get isRunOrRevertOnlyMigrationAppStart(): boolean {
    return !!(this.onlyMigrationRun || this.onlyMigrationRevertToTimestamp);
  }
  //#endregion

  //#region fields  / session
  session?: Models.ISession;
  //#endregion

  //#region fields / connection
  public connection: DataSource;
  //#endregion

  //#region fields / entities triggers
  private entitiesTriggers = {};
  //#endregion

  //#region fields / realtime
  private realtime: RealtimeCore;
  get realtimeClient() {
    return this.realtime.client;
  }
  get realtimeServer() {
    return this.realtime.server;
  }
  //#endregion

  //#region fields / config
  /**
   * available after init()
   */
  public config: Models.ContextOptions<any, any, any, any, any, any, any, any>;
  //#endregion

  //#region fields / logs
  get logHttp(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).http;
    }
    return this.config?.logs === true;
  }

  get logRealtime(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).realtime;
    }
    return this.config?.logs === true;
  }

  get logFramework(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).framework;
    }
    return this.config?.logs === true;
  }

  get logDb(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).db;
    }
    return this.config?.logs === true;
  }

  get logMigrations(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).migrations;
    }
    return this.config?.logs === true;
  }
  //#endregion

  //#endregion

  //#region constructor
  /**
   * Inside docker there is not need for https secure server
   */
  public readonly isRunningInsideDocker: boolean = false;
  constructor(
    private originalConfig: Models.ContextOptions<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >,
    private configFn: (
      env: any,
    ) => Models.ContextOptions<any, any, any, any, any, any, any, any>,
  ) {
    this.isRunningInsideDocker = UtilsOs.isRunningInDocker();
  }
  //#endregion

  //#region methods & getters / init
  public async init(options?: {
    initFromRecrusiveContextResovle?: boolean;
    overrideHost?: string | null;
    overrideRemoteHost?: string | null;
    onlyMigrationRun?: boolean;
    onlyMigrationRevertToTimestamp?: number;
  }) {
    const {
      initFromRecrusiveContextResovle,
      overrideHost,
      overrideRemoteHost,
      onlyMigrationRun,
      onlyMigrationRevertToTimestamp,
    } = options || {}; // TODO use it ?

    this.inited = true;
    // @ts-ignore
    this.onlyMigrationRun = onlyMigrationRun;
    // @ts-ignore
    this.onlyMigrationRevertToTimestamp = onlyMigrationRevertToTimestamp;
    this.config = this.configFn({});
    if (_.isObject(this.config.database)) {
      this.config.database = Models.DatabaseConfig.from(
        this.config.database as Models.DatabaseConfig,
      ).databaseConfigTypeORM;
    }
    if (overrideHost && overrideRemoteHost) {
      Helpers.throw(
        `[taon-config] You can't have overrideHost and overrideRemoteHost at the same time`,
      );
    }

    this.config.host = !_.isUndefined(overrideHost)
      ? overrideHost
      : this.config.host;
    this.config.remoteHost = !_.isUndefined(overrideRemoteHost)
      ? overrideRemoteHost
      : this.config.remoteHost;

    this.config.host = this.host === null ? void 0 : this.host;
    this.config.remoteHost =
      this.remoteHost === null ? void 0 : this.remoteHost;

    if (
      this.config.host &&
      !this.config.host.startsWith('http://') &&
      !this.config.host.startsWith('https://')
    ) {
      Helpers.throw(
        `[taon-config] Your 'host' must start with http:// or https://`,
      );
    }

    if (_.isUndefined(this.config.useIpcWhenElectron)) {
      this.config.useIpcWhenElectron = true;
    }

    if (
      this.config.remoteHost &&
      !this.config.remoteHost.startsWith('http://') &&
      !this.config.remoteHost.startsWith('https://')
    ) {
      Helpers.throw(
        `[taon-config] Your 'remoteHost' must start with http:// or https://`,
      );
    }

    //#region resolve if skipping writing server routes
    //@ts-expect-error overriding readonly
    this.skipWritingServerRoutes = _.isBoolean(
      this.config.skipWritingServerRoutes,
    )
      ? this.config.skipWritingServerRoutes
      : false;
    //#endregion

    //#region resolve mode
    if (this.config.host) {
      this.mode = 'backend-frontend(tcp+udp)';
      //#region @websqlOnly
      this.mode = 'backend-frontend(websql)';
      //#endregion
    }

    if (this.config.remoteHost) {
      if (this.config.host) {
        Helpers.throw(
          `[taon] You can't have remoteHost and host at the same time`,
        );
      }
      this.mode = 'remote-backend(tcp+udp)';
    }

    // console.log(`

    //   useIpcWhenElectron: ${this.config.useIpcWhenElectron}
    //   Helpers.isElectron: ${Helpers.isElectron}

    //   `)
    if (this.config.useIpcWhenElectron && Helpers.isElectron) {
      if (Helpers.isWebSQL) {
        this.mode = 'backend-frontend(websql-electron)';
      } else {
        this.mode = 'backend-frontend(ipc-electron)';
      }
    }

    // mode === undefined for BaseContext => ok behavior
    // console.log(`Mode for BE/FE communication: ${this.mode}`);
    // if(!this.mode) {
    //   console.log(this.config)
    // }

    if (!this.mode && !this.config.abstract) {
      Helpers.error(
        `[taon] Context "${this.contextName}": You need to provide host or remoteHost or useIpcWhenElectron`,
        false,
        true,
      );
      //#region @backend
      process.exit(1);
      //#endregion
    }
    //#endregion

    //#region resolve database config
    if (this.config.database === true) {
      this.logFramework &&
        console.log(`

        ASSIGNING AUTO GENERATED DATABASE CONFIG

        `);
      this.databaseConfig = this.getAutoGeneratedConfig();
    } else if (_.isObject(this.config.database)) {
      this.logFramework &&
        console.log(`

        OVERRIDE DATABASE CONFIG FROM CONFIGURATION

        `);
      this.databaseConfig = this.getAutoGeneratedConfig();
      walk.Object(
        this.config.database,
        (value, lodashPath) => {
          if (_.isNil(value) || _.isFunction(value) || _.isObject(value)) {
            // skipping
          } else {
            this.logFramework &&
              console.info(
                `Overriding database config: ${lodashPath}=${value}`,
              );
            _.set(this.databaseConfig, lodashPath, value);
          }
        },
        {
          walkGetters: false,
        },
      );
    }
    //#endregion

    //#region resolve session
    if (this.config.session) {
      this.session = _.cloneDeep(this.config.session);
      const oneHour = 1000 * 60 * 60 * 1; // 24;
      if (!this.session.cookieMaxAge) {
        this.session.cookieMaxAge = oneHour;
      }
      // serever and browser cookie authentication
      axios.defaults.withCredentials = true;
    }
    //#endregion

    //#region prepare & gather all classes recrusively
    this.config.contexts = this.config.contexts || {};
    this.config.entities = this.config.entities || {};
    this.config.controllers = this.config.controllers || {};
    this.config.repositories = this.config.repositories || {};
    this.config.providers = this.config.providers || {};
    this.config.subscribers = this.config.subscribers || {};
    this.config.migrations = this.config.migrations || {};

    this.config.entities = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.ENTITY,
      )),
      ...this.config.entities,
    };

    this.config.controllers = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.CONTROLLER,
      )),
      ...this.config.controllers,
    };

    this.config.providers = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.PROVIDER,
      )),
      ...this.config.providers,
    };

    this.config.middlewares = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.MIDDLEWARE,
      )),
      ...this.config.middlewares,
    };

    this.config.subscribers = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.SUBSCRIBER,
      )),
      ...this.config.subscribers,
    };

    this.config.repositories = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.REPOSITORY,
      )),
      ...this.config.repositories,
    };

    this.config.migrations = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.MIGRATION,
      )),
      ...this.config.migrations,
    };

    // console.log(this.config);
    // debugger;
    //#endregion

    //#region prepare classes instances/functions clones
    this.config.controllers = this.cloneClassesObjWithNewMetadata({
      classesInput: this.config.controllers,
      config: this.config,
      ctx: this,
      classType: Models.ClassType.CONTROLLER,
    });
    this.config.repositories = this.cloneClassesObjWithNewMetadata({
      classesInput: this.config.repositories,
      config: this.config,
      ctx: this,
      classType: Models.ClassType.REPOSITORY,
    });
    this.config.providers = this.cloneClassesObjWithNewMetadata({
      classesInput: this.config.providers,
      config: this.config,
      ctx: this,
      classType: Models.ClassType.PROVIDER,
    });
    this.config.middlewares = this.cloneClassesObjWithNewMetadata({
      classesInput: this.config.middlewares,
      config: this.config,
      ctx: this,
      classType: Models.ClassType.MIDDLEWARE,
    });

    this.config.subscribers = this.cloneClassesObjWithNewMetadata({
      classesInput: this.config.subscribers,
      config: this.config,
      ctx: this,
      classType: Models.ClassType.SUBSCRIBER,
    });

    this.config.migrations = this.cloneClassesObjWithNewMetadata({
      classesInput: this.config.migrations,
      config: this.config,
      ctx: this,
      classType: Models.ClassType.MIGRATION,
    });
    //#endregion

    //#region prepare instances
    for (const classTypeName of this.injectableTypesfromContexts) {
      this.classInstancesByNameObj[classTypeName] = {};
      this.objWithClassesInstancesArr[classTypeName] = [];
    }

    for (const classTypeName of this.injectableTypesfromContexts) {
      await this.createInstances(
        this.config[Models.ClassTypeKey[classTypeName]],
        classTypeName,
      );
    }
    //#endregion

    if (!this.isRunOrRevertOnlyMigrationAppStart) {
      //#region prepares server
      if (this.mode === 'backend-frontend(tcp+udp)' && !this.config.abstract) {
        //#region @backend
        this.expressApp = express();

        if (process.env.NODE_ENV === 'production') {
          this.expressApp.set('trust proxy', 1);
        }

        await this.initBackendMiddlewares();
        await this.initCustomBackendMiddlewares();
        const shouldStartHttpsSecureServer =
          this.isHttpServer && !this.isRunningInsideDocker;
        this.logFramework &&
          Helpers.info(`

          Starting server ${shouldStartHttpsSecureServer ? 'with' : 'without'} HTTPS secure server

          `);
        this.serverTcpUdp = shouldStartHttpsSecureServer
          ? new https.Server(
              {
                key: this.config.https?.key,
                cert: this.config.https?.cert,
              },
              this.expressApp,
            )
          : new http.Server(this.expressApp);
        this.publicAssets.forEach(asset => {
          this.expressApp.use(
            asset.serverPath,
            express.static(asset.locationOnDisk),
          );
        });
        //#endregion

        await this.initCustomClientMiddlewares();
      }
      //#endregion

      //#region prepare realtime
      if (!this.config.abstract) {
        this.disabledRealtime = !!this.config.disabledRealtime;
        //#region @backend
        if (Helpers.isRunningIn.cliMode()) {
          // TODO for now...
          this.disabledRealtime = true;
        }
        //#endregion
        this.realtime = new RealtimeCore(this);
      }
      //#endregion
    }

    //#region show context info
    // console.log({ ref })
    if (this.config.abstract) {
      this.logFramework &&
        Helpers.info(
          `[taon] Create abstract context: ${this.config.contextName}`,
        );
    } else {
      if (this.config.remoteHost) {
        this.logFramework &&
          Helpers.info(
            `[taon] Create context for remote host: ${this.config.remoteHost}`,
          );
      } else {
        this.logFramework &&
          Helpers.info(`[taon] Create context for host: ${this.config.host}`);
      }
    }
    //#endregion

    // update first exposed config
    Object.keys(this.config).forEach(key => {
      this.originalConfig[key] = this.config[key];
    });
  }
  //#endregion

  //#region methods & getters / get auto generated config
  private getAutoGeneratedConfig(): Models.DatabaseConfigTypeOrm {
    this.logFramework &&
      console.log(`


         IS RUNNING IN DOCKER: ${this.isRunningInsideDocker}

    `);
    //#region @websqlFunc
    let databaseConfig: Models.DatabaseConfig = Models.DatabaseConfig.from({});
    if (this.isRunningInsideDocker) {
      if (this.USE_MARIADB_MYSQL_IN_DOCKER) {
        // Helpers.info('Running in docker, using in mysql database');
        // // TODO auto resolve database config in docker
        // databaseConfig = Models.DatabaseConfig.from({
        //   database: `db-${this.contextName}.sqlite`,
        //   type: 'mysql',
        //   recreateMode: 'PRESERVE_DATA+MIGRATIONS',
        //   logging: this.logDb,
        //   databasePort: 3306,
        //   databaseHost: 'localhost',
        //   databaseUsername: 'root',
        //   databasePassword: 'admin',
        // });
      } else {
        // TOOD @LAST for now.. just use sqljs in docker
        this.logFramework &&
          console.log(`

          USING GENERATED CONFIG FOR SQLJS IN DOCKER

          `);

        //#region @backend
        const locationOfTheDatabase = crossPlatformPath([
          process.cwd(),
          `db-${this.contextName}.sqlite`,
        ]);
        //#endregion

        databaseConfig = databaseConfig = Models.DatabaseConfig.from({
          location: `db-${this.contextName}.sqlite`,
          type: 'sqljs',
          useLocalForage: false,
          recreateMode: 'PRESERVE_DATA+MIGRATIONS',
          logging: true,
        });

        //#region @backend
        if (!fse.existsSync(locationOfTheDatabase)) {
          databaseConfig.recreateMode = 'DROP_DB+MIGRATIONS';
        }
        // TODO @LAST add same thing for mariadb/mysql
        this.logFramework &&
          console.log(`
          location of database: ${locationOfTheDatabase}
          db file exists: ${fse.existsSync(locationOfTheDatabase)}
          synchronize: ${databaseConfig.synchronize}
          dropSchema: ${databaseConfig.dropSchema}
        `);
        //#endregion
      }
    } else {
      //#region auto resolve db config
      this.logFramework &&
        Helpers.info(
          `[taon][database] Automatically resolving database config for mode ${this.mode}`,
        );
      switch (this.mode) {
        //#region resolve database config for backend-frontend(ipc-electron)
        case 'backend-frontend(ipc-electron)':
          let dbLocationInOs: string;
          //#region @backend
          if (UtilsOs.isElectron) {
            dbLocationInOs = crossPlatformPath([
              UtilsOs.getRealHomeDir(),
              `.taon/databases-for-electron-apps/${
                this.appId || _.snakeCase(process.cwd()).replace(/\_/, '.')
              }/${this.contextName}.sqlite`,
            ]);
            if (!Helpers.exists(path.dirname(dbLocationInOs))) {
              Helpers.mkdirp(path.dirname(dbLocationInOs));
            }
          }
          //#endregion

          databaseConfig = Models.DatabaseConfig.from({
            location: UtilsOs.isElectron
              ? dbLocationInOs
              : `db-${this.contextName}.sqlite`,
            type: 'sqljs',
            recreateMode: 'DROP_DB+MIGRATIONS',
            logging: this.logDb,
          });
          break;
        //#endregion

        //#region  resolve database config for mode backend-frontend(websql)
        case 'backend-frontend(websql-electron)':
        case 'backend-frontend(websql)':
          let keepWebsqlDbDataAfterReload = false;
          //#region @browser
          keepWebsqlDbDataAfterReload =
            TaonAdminService.Instance?.keepWebsqlDbDataAfterReload; // TODO @LAST
          //#endregion

          databaseConfig = databaseConfig = Models.DatabaseConfig.from({
            location: `db-${this.contextName}.sqlite`,
            type: 'sqljs',
            useLocalForage: true, // !!window['localforage'], // TODO this need to be checked in runtime
            recreateMode: keepWebsqlDbDataAfterReload
              ? 'PRESERVE_DATA+MIGRATIONS'
              : 'DROP_DB+MIGRATIONS',
            logging: this.logDb,
          });
          break;
        //#endregion

        //#region resolve database config for mode backend-frontend(tcp+udp)
        case 'backend-frontend(tcp+udp)':
          databaseConfig = Models.DatabaseConfig.from({
            database: `context-db-${this.contextName}`,
            location: `db-${this.contextName}.sqlite`,
            type: 'sqljs',
            recreateMode: 'DROP_DB+MIGRATIONS',
            logging: this.logDb,
          });
          break;
        //#endregion
      }
      //#endregion
    }
    return databaseConfig.databaseConfigTypeORM;
    //#endregion
  }
  //#endregion

  //#region methods & getters / ng zone
  get ngZone(): any {
    //#region @browser
    return EndpointContext.ngZone;
    //#endregion
    return;
  }
  //#endregion

  //#region methods & getters / start server
  async startServer(): Promise<void> {
    //#region @backendFunc
    if (this.remoteHost || this.isRunOrRevertOnlyMigrationAppStart) {
      return;
    }
    if (this.mode === 'backend-frontend(tcp+udp)') {
      return await new Promise(resolve => {
        if (this.isRunningInsideDocker) {
          // this.displayRoutes(this.expressApp);
          this.serverTcpUdp.listen(Number(this.uriPort), '0.0.0.0', () => {
            Helpers.log(
              `Express server (inside docker) started 0.0.0.0:${this.uriPort}`,
            );
            Helpers.log(`[taon][express-server]listening on port: ${this.uriPort}, hostname: ${this.uriPathname},
    address: ${this.uriProtocol}//localhost:${this.uriPort}${this.uriPathname}
    ExpressJS mode: ${this.expressApp.settings.env}
    `);
            resolve(void 0);
          });
        } else {
          // this.displayRoutes(this.expressApp);
          this.serverTcpUdp.listen(Number(this.uriPort), () => {
            Helpers.log(
              `Express server (inside nodejs app) started on localhost:${this.uriPort}`,
            );
            Helpers.log(`[taon][express-server]listening on port: ${this.uriPort}, hostname: ${this.uriPathname},
    address: ${this.uriProtocol}//localhost:${this.uriPort}${this.uriPathname}
    expressJS mode: ${this.expressApp.settings.env}
            `);
            resolve(void 0);
          });
        }
      });
    } else {
      this.logFramework &&
        Helpers.info('Ipc communication enable instead tcp/upd');
    }
    //#endregion
  }
  //#endregion

  //#region methods & getters / display express routes
  displayRoutes(app) {
    //#region @backend
    const routes = [];

    app._router?.stack.forEach(function (middleware) {
      if (middleware.route) {
        // routes registered directly on the app
        const methods = [];
        for (let method in middleware.route.methods) {
          if (middleware.route.methods[method]) {
            methods.push(method.toUpperCase());
          }
        }
        routes.push({ path: middleware.route.path, methods: methods });
      } else if (middleware.name === 'router') {
        // router middleware
        middleware.handle.stack.forEach(function (handler) {
          const methods = [];
          for (let method in handler.route.methods) {
            if (handler.route.methods[method]) {
              methods.push(method.toUpperCase());
            }
          }
          routes.push({ path: handler.route.path, methods: methods });
        });
      }
    });

    console.log(routes);
    //#endregion
  }
  //#endregion

  //#region methods & getters / mode allows database creation
  get modeAllowsDatabaseCreation() {
    return (
      this.mode === 'backend-frontend(tcp+udp)' ||
      this.mode === 'backend-frontend(websql)' ||
      this.mode === 'backend-frontend(ipc-electron)'
    );
  }
  //#endregion

  //#region methods & getters / clone class
  private cloneClassWithNewMetadata = <
    T extends { new (...args: any[]): any },
  >({
    BaseClass,
    className,
    config,
    ctx,
    classType,
  }: {
    BaseClass: T;
    className: string;
    config: Models.ContextOptions<any, any, any, any, any, any, any, any>;
    ctx: EndpointContext;
    classType: Models.ClassType;
  }): T => {
    // Return a new class that extends the base class
    const cloneClass = () => {
      if (
        BaseClass[Symbols.fullClassNameStaticProperty] ===
        `${ctx.contextName}.${className}`
      ) {
        return BaseClass;
      }
      return class extends BaseClass {
        // static ['_'] = BaseClass['_'];

        // @ts-ignore
        static [Symbols.orignalClass] = BaseClass;

        // @ts-ignore
        static [Symbols.fullClassNameStaticProperty] = `${ctx.contextName}.${className}`;

        // @ts-ignore
        static [Symbols.classNameStaticProperty] = className;

        static [Symbols.ctxInClassOrClassObj] = ctx;
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        static __getFullPathForClass__(arr = []) {
          const name = this[Symbols.fullClassNameStaticProperty];
          arr.push(name);
          // @ts-ignore
          if (
            this[Symbols.orignalClass] && // @ts-ignore
            this[Symbols.orignalClass].__getFullPathForClass__
          ) {
            // @ts-ignore
            this[Symbols.orignalClass].__getFullPathForClass__(arr);
          }
          return arr.join('/');
        }
        static get fullPathForClass(): string {
          return this.__getFullPathForClass__();
        }
        [Symbols.ctxInClassOrClassObj] = ctx;
        // You can override prototype properties or methods here if needed
        // static properties override allowed
      };
    };

    const cloneClassFunction = cloneClass();

    //#region gather all instances for all contexts
    // TODO this is not needed anymore - for typeorm I use normal entities
    // this thinng belowe is nice for debugging purpose
    // if (_.isUndefined(cloneClassFunction[Symbols.orignalClassClonesObj])) {
    //   cloneClassFunction[Symbols.orignalClassClonesObj] = {};
    // }
    // if (_.isUndefined(BaseClass[Symbols.orignalClassClonesObj])) {
    //   BaseClass[Symbols.orignalClassClonesObj] = {};
    // }
    // const all = {
    //   ...BaseClass[Symbols.orignalClassClonesObj],
    //   ...cloneClassFunction[Symbols.orignalClassClonesObj],
    // };
    // all[ctx.contextName] = cloneClassFunction;
    // cloneClassFunction[Symbols.orignalClassClonesObj] = all;
    // BaseClass[Symbols.orignalClassClonesObj] = all;
    //#endregion

    return cloneClassFunction;
  };

  //#endregion

  //#region methods & getters / clone classes obj with new metadata
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private cloneClassesObjWithNewMetadata = ({
    classesInput,
    config,
    ctx,
    classType,
  }: {
    classesInput: any;
    config: Models.ContextOptions<any, any, any, any, any, any, any, any>;
    ctx: EndpointContext;
    classType: Models.ClassType;
  }) => {
    const classes = {};
    // console.log(Object.keys(classesInput))
    for (const key of Object.keys(classesInput || {})) {
      const BaseClass = classesInput[key];

      if (!BaseClass) {
        Helpers.error(`Class ${key} is not defined in context ${ctx.contextName}

        Please check if you have correct import in context file

        `);
      }

      var className = Reflect.getMetadata(
        Symbols.metadata.className,
        BaseClass,
      );

      // console.log('Metadata className', className, BaseClass);
      // if (!className) {
      //   console.warn(`Please provide className for ${BaseClass.name} class`);
      // }
      className = className || key;
      BaseClass[Symbols.classNameStaticProperty] = className;

      const clonedClass = this.cloneClassWithNewMetadata({
        BaseClass,
        className,
        config,
        ctx,
        classType,
      });
      classes[className] = clonedClass;
    }
    return classes;
  };
  //#endregion

  //#region methods & getters / get recursive classes from contexts
  private async getRecrusiveClassesfromContextsObj(
    classType: Models.ClassType,
  ) {
    const arr = await this.getRecrusiveClassesfromContexts(classType);
    return arr.reduce((acc, c) => {
      acc[ClassHelpers.getName(c)] = c;
      return acc;
    }, {});
  }

  private async getRecrusiveClassesfromContexts(
    classType: Models.ClassType,
    arr = [],
  ) {
    const contexts = Object.values(this.config.contexts || {}) as ReturnType<
      typeof createContext
    >[];
    // console.log({
    //   contexts,
    // });
    for (const ctx of contexts) {
      // console.log(`STARTING ${ctx.contextName}`);
      const ref = await ctx.__ref();
      // console.log(`CTX FROM ${ctx.contextName}`, ref.contextName);
      const classesInput = ref.getClassFunBy(classType);
      // console.log(`${ref.contextName} - ${classType}`, { classesInput });

      const clonedClasses = Object.values(
        this.cloneClassesObjWithNewMetadata({
          classesInput,
          config: this.config,
          ctx: this,
          classType,
        }),
      );
      // console.log(`${classType} clonedClasses`, clonedClasses);
      clonedClasses.forEach(c => arr.push(c));

      await ref.getRecrusiveClassesfromContexts(classType, arr);
    }
    return arr as Function[];
  }
  //#endregion

  //#region methods & getters / get class instances by class type
  getClassInstanceObjBy(classType: Models.ClassType): any {
    return this.classInstancesByNameObj[classType];
  }
  //#endregion

  //#region methods & getters / get class instances arr
  private getClassesInstancesArrBy(classType: Models.ClassType): any[] {
    return this.objWithClassesInstancesArr[classType];
  }
  //#endregion

  //#region methods & getters / inject
  inject<T>(
    ctor: new (...args: any[]) => T,
    options: {
      localInstance?: boolean;
      contextClassInstance?: BaseInjector;
      locaInstanceConstructorArgs?: ConstructorParameters<typeof ctor>;
      parentInstanceThatWillGetInjectedStuff: object;
    },
  ): T {
    const className = ClassHelpers.getName(ctor);

    const locaInstanceConstructorArgs =
      options.locaInstanceConstructorArgs || [];

    if (this.isCLassType(Models.ClassType.REPOSITORY, ctor)) {
      options.localInstance = true;
    }

    if (options?.localInstance) {
      const ctxClassFn = this.getClassFunByClassName(className);
      let entityName: string = '';

      // entity thing is only for repositories local repositories
      // if (className === 'BaseRepository') {
      const entityFn = _.first(locaInstanceConstructorArgs);
      const entity = entityFn && entityFn();
      entityName = (entity && ClassHelpers.getName(entity)) || '';
      // console.log(`entityName `, entityName);
      // }

      if (!options.contextClassInstance[this.localInstaceObjSymbol]) {
        options.contextClassInstance[this.localInstaceObjSymbol] = {};
      }
      const instanceKey = className + (entityName ? `.${entityName}` : '');

      const existed =
        options.contextClassInstance[this.localInstaceObjSymbol][instanceKey];

      if (existed) {
        // console.log(
        //   `EXISTED ${ClassHelpers.getName(options.parentInstanceThatWillGetInjectedStuff)} Inject ${className} instanceKey "${instanceKey}"`,
        // );
        return existed;
      }

      // console.log(
      //   `NEW ${ClassHelpers.getName(options.parentInstanceThatWillGetInjectedStuff)} Inject ${className} instanceKey "${instanceKey}"`,
      // );

      if (!ctxClassFn) {
        throw new Error(`Not able to inject "${className}" inside context "${this.contextName}"

        Make sure they share the same context or import context where "${className}" is defined.

        `);
      }

      const injectedInstance = new (ctxClassFn as any)(
        ...locaInstanceConstructorArgs,
      );
      options.contextClassInstance[this.localInstaceObjSymbol][instanceKey] =
        injectedInstance;
      // console.log(`injectedInstance `, existed)
      return injectedInstance;
    }

    const contextScopeInstance = this.allClassesInstances[className];
    // if (className === 'TopicController') {
    //   debugger;
    // }
    return contextScopeInstance;
  }

  /**
   * alias for inject
   */
  getInstanceBy<T>(ctor: new (...args: any[]) => T): T {
    // if (!!this.__contextForControllerInstanceAccess) {
    //   const className = ClassHelpers.getName(ctor);
    //   const allControllers = this.getClassFunByArr(Models.ClassType.CONTROLLER);

    //   // TODO QUICK_FIX cache controllers
    //   for (const ctrl of allControllers) {
    //     if (ClassHelpers.getName(ctrl) === className) {
    //       // console.log('injecting from contextForControllerInstanceAcesss', className);
    //       return this.__contextForControllerInstanceAccess.inject(ctor, {
    //         localInstance: false,
    //       });
    //     }
    //   }
    // }

    return this.inject(ctor, {
      localInstance: false,
      parentInstanceThatWillGetInjectedStuff: this,
    });
  }
  //#endregion

  //#region methods & getters / check if context initialized
  checkIfContextInitialized() {
    if (_.isUndefined(this.config)) {
      throw new Error(`Please check if your context has been initialized.

      // ...
      await Context.initialize();
      // ...


      `);
    }
  }
  //#endregion

  //#region methods & getters / get class function by class type name
  getClassFunBy(classType: Models.ClassType) {
    this.checkIfContextInitialized();
    switch (classType) {
      case Models.ClassType.CONTROLLER:
        return this.config.controllers;
      case Models.ClassType.ENTITY:
        return this.config.entities;
      case Models.ClassType.PROVIDER:
        return this.config.providers;
      case Models.ClassType.MIDDLEWARE:
        return this.config.middlewares;
      case Models.ClassType.REPOSITORY:
        return this.config.repositories;
      case Models.ClassType.SUBSCRIBER:
        return this.config.subscribers;
      case Models.ClassType.MIGRATION:
        return this.config.migrations;
    }
  }

  isCLassType(classType: Models.ClassType, classFn: Function): boolean {
    return !!this.getClassFunBy(classType)[ClassHelpers.getName(classFn)];
  }

  /**
   * Only for injectable types
   * Only for classType: CONTROLLER, REPOSITORY, PROVIDER, MIDDLEWARES
   */
  getClassFunByClassName(className: string): Function {
    for (const classTypeName of this.allTypesfromContexts) {
      const classesForInjectableType =
        this.config[Models.ClassTypeKey[classTypeName]];

      if (classesForInjectableType[className]) {
        return classesForInjectableType[className];
      }
    }
  }

  getClassFunByClass(classFunction: Function): Function {
    const className = ClassHelpers.getName(classFunction);
    return this.getClassFunByClassName(className);
  }

  getClassFunByArr(classType: Models.ClassType) {
    return Object.values(this.getClassFunBy(classType) || {}) as Function[];
  }
  //#endregion

  //#region methods & getters / create class instances
  private async createInstances(classes: any, classType: Models.ClassType) {
    // const recrusiveValuesFromContext =
    //   await this.getRecrusiveClassesfromContexts(classType);
    // console.log(this.config.contexts);
    // console.log('recrusiveValuesFromContext', recrusiveValuesFromContext);

    for (const classFn of [
      // ...recrusiveValuesFromContext,
      ...Object.values(classes),
    ]) {
      const instance = DITaonContainer.resolve(classFn as any) as any;
      const classInstancesByNameObj = this.classInstancesByNameObj[classType];
      const className = ClassHelpers.getName(classFn);
      // console.log({ classFn, classType, instance, place, className, 'classInstancesByNameObj': this.classInstancesByNameObj });
      classInstancesByNameObj[className] = instance;
      // update config
      this.config[Models.ClassTypeKey[classType]][className] = classFn;
      this.objWithClassesInstancesArr[classType].push(instance);
      this.allClassesInstances[className] = instance;
    }
  }
  //#endregion

  //#region methods & getters / init classes
  async initClasses(): Promise<void> {
    if (this.remoteHost) {
      return;
    }

    //#region @websql
    for (const classFun of this.getClassFunByArr(
      Models.ClassType.ENTITY,
    ) as any[]) {
      const repo = (await this.connection.getRepository(
        ClassHelpers.getOrginalClass(classFun),
      )) as any;
      this.repos.set(ClassHelpers.getName(classFun), repo);
    }
    //#endregion

    for (const classTypeName of [
      Models.ClassType.MIDDLEWARE,
      Models.ClassType.PROVIDER,
      Models.ClassType.REPOSITORY,
      Models.ClassType.CONTROLLER,
      Models.ClassType.ENTITY,
      Models.ClassType.MIGRATION,
    ]) {
      //#region init class static _ property
      for (const classFun of this.getClassFunByArr(classTypeName) as any[]) {
        if (_.isFunction(classFun._)) {
          await classFun._();
        }
      }
      //#endregion
    }

    for (const classTypeName of [
      Models.ClassType.MIDDLEWARE,
      Models.ClassType.PROVIDER,
      Models.ClassType.REPOSITORY,
      Models.ClassType.CONTROLLER,
      Models.ClassType.MIGRATION,
    ]) {
      //#region init providers, repositories  _ property
      // Helpers.taskStarted(
      //   `[taon] REINITING _ INS FN ${classTypeName} ${this.contextName} STARTED`,
      // );
      for (const ctrl of this.getClassesInstancesArrBy(classTypeName)) {
        if (_.isFunction(ctrl._)) {
          await ctrl._();
        }
      }
      // Helpers.taskStarted(
      //   `[taon] REINITING _ INS FN ${classTypeName} ${this.contextName} DONE`,
      // );
      //#endregion
    }
  }
  //#endregion

  //#region methods & getters / is active on
  isActiveOn(classInstance: object): boolean {
    let contextRef: EndpointContext =
      classInstance[Symbols.ctxInClassOrClassObj];
    return this === contextRef;
  }
  //#endregion

  //#region methods & getters / uri
  get frontendHostUri() {
    const url = this.config?.frontendHost?.startsWith('http')
      ? this.config.frontendHost
      : `${globalThis?.location?.protocol || 'http:'}//${this.config?.frontendHost}`;
    const uri = new URL(url.replace(/\/$/, ''));
    return uri;
  }

  get uri() {
    const url = this.host
      ? new URL(this.host)
      : this.remoteHost
        ? new URL(this.remoteHost)
        : void 0;

    return url;
  }
  //#endregion

  get uriPort(): string | undefined {
    if (!this.uri?.origin?.includes('localhost')) {
      return this.config?.hostPortNumber?.toString();
    }
    return this.uri?.port;
  }

  get uriProtocol(): string | undefined {
    return this.uri?.protocol;
  }

  /**
   * Examples
   * http://localhost:3000
   * https://localhost (from localhost:80)   *
   */
  get uriOrigin(): string | undefined {
    return this.uri?.origin;
  }

  /**
   * Exampels
   * http://localhost:3000/path/to/somewhere
   * https://localhost/path/to/somewhere (from localhost:80)
   */
  // get uriOriginWithPathname(): string | undefined {
  //   return this.uri?.origin
  //     ? this.uri?.origin + this.uriPathnameOrNothingIfRoot.replace(/\/$/, '')
  //     : undefined;
  // }

  get uriPathname(): string | undefined {
    return this.uri?.pathname;
  }

  /**
   * Examples
   * http://localhost:3000/path/to/somewhere -> '/path/to/somewhere'
   * http://localhost:3000 -> '' #
   * https://localhost/path/to/  -> '/path/to/somewhere' # remove last slash
   */
  get uriPathnameOrNothingIfRoot(): string {
    const isNonRootProperPathName =
      this.uri?.pathname && this.uri.pathname !== '/';
    return isNonRootProperPathName ? this.uri.pathname.replace(/\/$/, '') : '';
  }

  /**
   * Port from uri as number
   * @returns {Number | undefined}
   */
  get port(): Number | undefined {
    return this.uri?.port ? Number(this.uriPort) : undefined;
  }

  //#region methods & getters / is https server
  get isHttpServer() {
    return this.uriProtocol === 'https:';
  }
  //#endregion

  //#region methods & getters / public assets
  /**
   * ipc/udp needs this
   */
  public get contextName(): string {
    return this.config.contextName;
  }
  //#endregion

  public get cwd(): string {
    return this.config.cwd || process.cwd();
  }

  public get activeContext(): string | null {
    return this.config.activeContext || null;
  }

  public get appId(): string {
    return this.config.appId;
  }

  //#region methods & getters / public assets
  public get publicAssets() {
    return this.config?.publicAssets || [];
  }
  //#endregion

  //#region methods & getters / is production mode
  get isProductionMode() {
    return this.config.productionMode;
  }
  //#endregion

  //#region methods & getters / remote host
  get remoteHost() {
    return this.config.remoteHost;
  }
  //#endregion

  //#region methods & getters / host
  get host() {
    return this.config.host;
  }
  //#endregion

  //#region methods & getters / host
  get orgin() {
    return this.uri?.origin;
  }
  //#endregion

  //#region methods & getters / init subscribers
  async initSubscribers() {
    //#region @websqlFunc
    if (this.remoteHost) {
      return;
    }
    const subscriberClasses = this.getClassFunByArr(
      Models.ClassType.SUBSCRIBER,
    );
    for (const subscriberClassFn of subscriberClasses) {
      const options = Reflect.getMetadata(
        Symbols.metadata.options.subscriber,
        subscriberClassFn,
      ) as TaonSubscriberOptions;
      // console.log('subscriber options', options);
      // const nameForSubscriber = ClassHelpers.getName(subscriber);
      EventSubscriber()(subscriberClassFn);
    }
    //#endregion
  }
  //#endregion

  //#region methods & getters / init entities
  async initEntities() {
    //#region @websql
    if (this.remoteHost) {
      return;
    }
    const entities = this.getClassFunByArr(Models.ClassType.ENTITY);

    for (const entity of entities) {
      const options = Reflect.getMetadata(
        Symbols.metadata.options.entity,
        entity,
      ) as TaonEntityOptions;
      const createTable = _.isUndefined(options.createTable)
        ? true
        : options.createTable;

      const nameForEntity = ClassHelpers.getName(entity);

      if (createTable) {
        this.logDb &&
          console.info(
            `[taon][typeorm] create table for entity "${nameForEntity}" ? '${createTable}'`,
          );
        // console.log('TypeormEntity', { TypeormEntity });
        TypeormEntity(nameForEntity)(entity);
      } else {
        this.logDb &&
          console.info(
            `[taon][typeorm] create table for entity "${nameForEntity}" ? '${createTable}'`,
          );
      }
    }
    //#endregion
  }

  //#endregion

  //#region methods & getters / destroy
  async destroy(): Promise<void> {
    //#region @websqlFunc
    if (this.connection) {
      await this.connection?.destroy();
      delete this.connection;
    }

    if (this.serverTcpUdp) {
      await new Promise(resolve => {
        this.serverTcpUdp?.close(() => {
          resolve(true);
        });
      });
      delete this.serverTcpUdp;
    }
    delete this.expressApp;
    //#endregion
  }
  //#endregion

  //#region methods & getters / init connection
  async initDatabaseConnection(): Promise<void> {
    //#region @websqlFunc
    if (this.remoteHost || !this.databaseConfig) {
      return;
    }
    const entities = this.getClassFunByArr(Models.ClassType.ENTITY).map(
      entityFn => {
        return ClassHelpers.getOrginalClass(entityFn);
      },
    );

    const subscribers = this.getClassFunByArr(Models.ClassType.SUBSCRIBER);

    let autoSave = false;
    if (!_.isNil(this.databaseConfig.autoSave)) {
      autoSave = this.databaseConfig.autoSave;
    } else {
      if (this.USE_MARIADB_MYSQL_IN_DOCKER) {
        autoSave = !this.isRunningInsideDocker; // in docker I am using mysql or posgress
      } else {
        autoSave = true; // on docker with sqljs I need to save db
      }
    }

    const dataSourceDbConfig = _.isObject(this.databaseConfig)
      ? ({
          type: this.databaseConfig.type,
          port: this.databaseConfig.databasePort,
          host: this.databaseConfig.databaseHost,
          database: this.databaseConfig.database as any,
          username: this.databaseConfig.databaseUsername,
          password: this.databaseConfig.databasePassword,
          useLocalForage: this.databaseConfig.useLocalForage,
          // I am not using typeorm migration system
          entities,
          subscribers,
          synchronize: this.isRunOrRevertOnlyMigrationAppStart
            ? false
            : this.databaseConfig.synchronize,
          autoSave,
          dropSchema: this.isRunOrRevertOnlyMigrationAppStart
            ? false
            : this.databaseConfig.dropSchema,
          logging: !!this.databaseConfig.logging,
          location: this.databaseConfig.location,
        } as DataSourceOptions)
      : ({} as DataSourceOptions);

    // debugger;
    this.logFramework &&
      console.log(
        `[Context: "${this.contextName}"] dataSourceDbConfig`,
        dataSourceDbConfig,
      );

    if (this.modeAllowsDatabaseCreation && this.databaseConfig) {
      this.logDb &&
        this.logFramework &&
        Helpers.info('[taon][database] prepare typeorm connection...');
      try {
        const connection = new DataSource(dataSourceDbConfig);
        this.connection = connection;
        await this.connection.initialize();
      } catch (error) {
        console.error(
          `[taon][typeorm] Error while initializing connection for ${this.contextName}, ERROR STARTED `,
        );
        console.error(error?.stack || '< No stack trace > ');
        console.error(error?.message || error);
        console.error(
          `[taon][typeorm] Error while initializing connection for ${this.contextName}, ERROR ENDS `,
        );
      }

      if (!this.connection?.isInitialized) {
        console.log('WRONG CONFIG', dataSourceDbConfig);
        throw new Error(`Something wrong with connection init in ${this.mode}`);
        //#region @backend
        process.exit(1);
        //#endregion
      }

      if (this.logDb || this.logFramework) {
        console.info(
          `

        CONTECTION OK for ${this.contextName} - ${this.mode}

        [taon][typeorm] db prepration done.. db initialize=${this.connection?.isInitialized}


        `,
          // dataSourceDbConfig,
          { 'this.connection': !!this.connection },
        );
        console.log(
          `Database file location: ${this.connection.options.database}`,
        );
      }
      //     const entityMetadata = getMetadataArgsStorage();
      //     console.log(
      //       `

      // entityMetadata after connection init for ${this.contextName} - ${this.mode}

      // `,
      //       entityMetadata,
      //     );
      //     debugger;
    } else {
      Helpers.info(`[taon][typeorm] Not initing db for mode ${this.mode}`);
    }
    //#endregion
  }

  //#endregion

  //#region methods & getters / initialize metadata
  async initControllers(): Promise<void> {
    if (this.isRunOrRevertOnlyMigrationAppStart) {
      return;
    }
    const allControllers = this.getClassFunByArr(Models.ClassType.CONTROLLER);
    // console.log('allControllers', allControllers);
    for (const controllerClassFn of allControllers) {
      controllerClassFn[Symbols.classMethodsNames] =
        ClassHelpers.getMethodsNames(controllerClassFn);
      const configs = ClassHelpers.getControllerConfigs(controllerClassFn);

      // console.log(`Class config for ${ClassHelpers.getName(controllerClassFn)}`, configs)
      const classConfig: ControllerConfig = configs[0];

      //#region update class calculate path
      const parentscalculatedPath = _.slice(configs, 1)
        .reverse()
        .map(bc => {
          if (TaonHelpers.isGoodPath(bc.path)) {
            return bc.path;
          }
          return bc.className;
        })
        .join('/');

      if (TaonHelpers.isGoodPath(classConfig.path)) {
        classConfig.calculatedPath = classConfig.path;
      } else {
        classConfig.calculatedPath = (
          `${this.uriPathnameOrNothingIfRoot}` +
          `/${apiPrefix}/${this.contextName}/tcp${parentscalculatedPath}/` +
          `${ClassHelpers.getName(controllerClassFn)}`
        )
          .replace(/\/\//g, '/')
          .split('/')
          .reduce((acc, bc) => {
            return _.last(acc) === bc ? acc : [...acc, bc];
          }, [])
          .join('/');
      }
      //#endregion

      // console.log('calculatedPath', classConfig.calculatedPath);

      _.slice(configs, 1).forEach(bc => {
        const alreadyIs = classConfig.methods;
        const toMerge = _.cloneDeep(bc.methods);
        for (const key in toMerge) {
          if (toMerge.hasOwnProperty(key) && !alreadyIs[key]) {
            const element = toMerge[key];
            alreadyIs[key] = element;
          }
        }
      });

      //#region @backend
      if (!Helpers.isRunningIn.cliMode()) {
        //#endregion
        this.logHttp &&
          console.groupCollapsed(
            `[taon][express-server] routes [${classConfig.className}]`,
          );
        //#region @backend
      }
      //#endregion

      // console.log('methods', classConfig.methods);
      const methodNames = Object.keys(classConfig.methods);
      for (const methodName of methodNames) {
        const methodConfig: Models.MethodConfig =
          classConfig.methods[methodName];
        // debugger
        const type: Models.Http.Rest.HttpMethod = methodConfig.type;

        // this is quick fix - in docker global path should not be used
        const globalPathPart =
          this.isRunningInsideDocker ||
          !this.frontendHostUri?.origin?.includes('localhost') // fe with domain -> is in docker
            ? `${this.uriPathnameOrNothingIfRoot.replace(/\/$/, '')}/${apiPrefix}/${this.contextName}`.replace(
                /\/\//,
                '/',
              )
            : '';
        const expressPath = methodConfig.global
          ? `${globalPathPart}/${methodConfig.path?.replace(/\/$/, '')}`.replace(
              /\/\//,
              '/',
            )
          : TaonHelpers.getExpressPath(classConfig, methodConfig);

        // console.log({ expressPath });
        if (Helpers.isNode || Helpers.isWebSQL) {
          //#region @websql

          const route = this.initServer(
            type,
            methodConfig,
            classConfig,
            expressPath,
            controllerClassFn,
          );

          this.activeRoutes.push({
            expressPath: route.expressPath,
            method: route.method,
          });
          //#endregion
        }

        const shouldInitClient =
          Helpers.isBrowser || this.remoteHost || Helpers.isWebSQL;
        // console.log('shouldInitClient', shouldInitClient);
        if (shouldInitClient) {
          // console.log(
          //   'initClient',
          //   ClassHelpers.getFullInternalName(controllerClassFn),
          //   type,
          //   methodConfig,
          //   expressPath,
          // );
          await this.initClient(
            controllerClassFn,
            type,
            methodConfig as any,
            expressPath,
          );
        }
      }

      //#region @backend
      if (!Helpers.isRunningIn.cliMode()) {
        //#endregion
        this.logHttp && console.groupEnd();
        //#region @backend
      }
      //#endregion
    }
  }
  //#endregion

  //#region methods & getters / write active routes
  public writeActiveRoutes() {
    if (
      this.remoteHost ||
      this.isRunOrRevertOnlyMigrationAppStart ||
      this.skipWritingServerRoutes
    ) {
      return;
    }
    // const contexts: EndpointContext[] = [this];
    //#region @websql

    const troutes = Utils.uniqArray(
      this.activeRoutes.map(f => {
        return `${f.method} ${f.expressPath}`;
      }),
    ).map(f => {
      const [method, expressPath] = f.split(' ');
      return (
        `\n### ${_.startCase(_.last(expressPath.split('/')))}\n` +
        TaonHelpers.fillUpTo(method.toUpperCase() + ' ', 10) +
        this.uriOrigin +
        expressPath
      );

      // return `${TaonHelpers.string(method.toUpperCase() + ':')
      // .fillUpTo(10)}${context.uriHref.replace(/\/$/, '')}${expressPath}`
    });
    const routes = [
      ...['', `#  ROUTES FOR HOST ${this.uriOrigin} `],
      ...troutes,
    ].join('\n');
    const fileName = crossPlatformPath([
      //#region @backend
      process.cwd(),
      //#endregion
      `routes-${this.config.contextName}.rest`,
    ]);

    this.logFramework && console.log(`[taon] routes file: ${fileName} `);
    // Helpers.log(JSON.stringify(routes, null, 4))
    //#region @backend
    if (!UtilsOs.isElectron) {
      Helpers.writeFile(fileName, routes);
    }
    //#endregion
    //#endregion
  }
  //#endregion

  //#region methods & getters / middlewares
  public get middlewares(): Models.MiddlewareType[] {
    //#region @backendFunc
    return this.config.middlewares || [];
    //#endregion
  }
  //#endregion

  //#region methods & getters / init middlewares

  private async initCustomClientMiddlewares(): Promise<void> {
    const middlewares = this.getClassesInstancesArrBy(
      Models.ClassType.MIDDLEWARE,
    )
      .map(f => f as BaseMiddleware)
      .filter(f => _.isFunction(f.interceptClient));

    middlewares.forEach(instance => {
      const contextName = this.contextName;
      const interceptorName = `${contextName}-${ClassHelpers.getName(instance)}`;
      Resource.request.interceptors.set(interceptorName, {
        intercept: ({ req, next }) => {
          const url = new URL(req.url);
          if (
            url.pathname.startsWith(
              `${this.uriPathnameOrNothingIfRoot}/${apiPrefix}/${contextName}/`,
            )
          ) {
            // console.log('intercepting', url.pathname, req);
            return instance.interceptClient({
              req,
              next,
            });
          }
          return next.handle(req);
        },
      });
    });
  }

  private async initCustomBackendMiddlewares(): Promise<void> {
    //#region @backend
    const app = this.expressApp;
    const middlewares = this.getClassesInstancesArrBy(
      Models.ClassType.MIDDLEWARE,
    );

    for (const middleware of middlewares) {
      const middlewareInstance: BaseMiddleware = middleware as any;
      if (_.isFunction(middlewareInstance.interceptServer)) {
        const middlewareFn = ClassHelpers.asyncHandler(
          async (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
          ) => {
            if (
              req.originalUrl.startsWith(
                `${this.uriPathnameOrNothingIfRoot}/${apiPrefix}/${this.contextName}/`,
              )
            ) {
              await middlewareInstance.interceptServer({
                req,
                res,
                next,
              });
            } else {
              next();
            }
          },
        );

        app.use(middlewareFn);
      }
    }
    //#endregion
  }

  private async initBackendMiddlewares(): Promise<void> {
    //#region @backend
    const app = this.expressApp;

    // if (this.middlewares) {
    //   this.middlewares.forEach(m => {
    //     const [fun, args] = m;
    //     app.use(fun.apply(null, args));
    //   });
    // }

    this.expressApp.get('/helloworld', (req, res) => {
      res.send(`Hello, world from context ${this.contextName}`);
    });

    // app.use(fileUpload());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(cookieParser());

    if (this.session) {
      Helpers.info(
        '[taon][express-server] session enabled for this context ' +
          this.contextName,
      );
      const { cookieMaxAge } = this.session;
      const frontendHost = this.config.frontendHost;

      const sessionObj = {
        frontendHost,
        secret: 'mysecretsessioncookithing',
        saveUninitialized: true,
        cookieMaxAge,
        secure: frontendHost.startsWith('https://'),
        resave: false,
      } as Models.ISession;

      app.use(
        cors({
          credentials: true,
          origin: frontendHost,
        }),
      );
      app.use(expressSession(sessionObj));
      console.log(`

      CORS ENABLED FOR SESSION

      `);
    } else {
      // if(this.config?.serverLogs) {
      this.logHttp &&
        Helpers.info(
          `[taon][express-server] session not enabled for this context '${this.contextName}'`,
        );
      // }
      app.use(
        cors({
          // origin: "http://localhost:5555",
          // methods: ["GET", "POST"],
          // allowedHeaders: ["my-custom-header"],
          // credentials: true
        }),
      );
      this.logHttp &&
        console.log(`

      CORS ENABLED WITHOUT SESSION

      `);
    }

    (() => {
      app.use((req, res, next) => {
        //#region good for cors session obj
        // if (this.context.session) {
        //   res.header('Access-Control-Allow-Origin', this.context.session.frontendHost);
        //   res.header('Access-Control-Allow-Credentials', 'true');
        //   res.header(
        //     'Access-Control-Allow-Headers',
        //     'Origin, X-Requested-With, Content-Type, Accept'
        //   );
        //   res.header("Access-Control-Allow-Methods", "PUT,POST,GET,HEAD,DELETE,OPTIONS,PATCH");
        // // maybe this
        // res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
        // }
        //#endregion

        res.set(
          'Access-Control-Expose-Headers',
          [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            Symbols.old.X_TOTAL_COUNT,
            Symbols.old.MAPPING_CONFIG_HEADER,
            Symbols.old.CIRCURAL_OBJECTS_MAP_BODY,
            Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM,
          ].join(', '),
        );
        next();
      });
    })();

    //#endregion
  }
  //#endregion

  //#region methods & getters / init methods node
  private initServer(
    //#region parameters
    httpMethodType: Models.Http.Rest.HttpMethod,
    methodConfig: Models.MethodConfig,
    classConfig: ControllerConfig,
    expressPath: string,
    target: Function,
    //#endregion
  ): { expressPath: string; method: Models.Http.Rest.HttpMethod } {
    //#region resolve variables

    const middlewareHandlers = (
      Array.isArray(methodConfig.middlewares) &&
      methodConfig.middlewares?.length > 0
        ? methodConfig.middlewares
        : []
    )
      .map(middlewareClassFun => {
        const middlewareInstance: BaseMiddleware = this.getInstanceBy(
          middlewareClassFun as any,
        );
        if (
          middlewareInstance &&
          _.isFunction(middlewareInstance.interceptServerMethod)
        ) {
          const middlewareFn = ClassHelpers.asyncHandler(
            async (
              req: express.Request,
              res: express.Response,
              next: express.NextFunction,
            ) => {
              middlewareInstance.interceptServerMethod(
                {
                  req,
                  res,
                  next,
                },
                {
                  methodName: methodConfig.methodName,
                  expressPath,
                  httpRequestType: methodConfig.type,
                },
              );
            },
          );
          return middlewareFn;
        }
      })
      .filter(f => !!f) as express.RequestHandler[];

    // const url = this.uri;

    //#region get result
    const getResult = async (resolvedParams, req, res) => {
      const response: Models.Http.Response<any> =
        methodConfig.descriptor.value.apply(
          /**
           * Context for method @GET,@PUT etc.
           */
          this.getInstanceBy(target as any),
          /**
           * Params for method @GET, @PUT etc.
           */
          resolvedParams,
        );
      let result = await getResponseValue(response, { req, res });
      return result;
    };
    //#endregion

    // console.log(`BACKEND: expressPath: "${expressPath}" `);
    //#endregion

    if (Helpers.isElectron) {
      //#region @backend
      const ipcKeyName = TaonHelpers.ipcKeyNameRequest(
        target,
        methodConfig,
        expressPath,
      );
      ipcMain.on(ipcKeyName, async (event, paramsFromBrowser) => {
        const responseJsonData = await getResult(
          paramsFromBrowser,
          void 0,
          void 0,
        );
        const sendToIpsMainOn = TaonHelpers.ipcKeyNameResponse(
          target,
          methodConfig,
          expressPath,
        );
        // console.log({ sendToIpsMainOn });
        event.sender.send(sendToIpsMainOn, responseJsonData);
      });
      return {
        expressPath,
        method: methodConfig.type,
      };
      //#endregion
    }

    if (!this.remoteHost) {
      //#region apply dummy websql express routers
      //#region @websql
      if (Helpers.isWebSQL) {
        if (!this.expressApp[httpMethodType.toLowerCase()]) {
          this.expressApp[httpMethodType.toLowerCase()] = () => {};
          // TODO add middlewares for WEBSQL and ELECTRON mode
        }
      }
      //#endregion
      //#endregion

      //#region @backend
      this.logHttp &&
        console.log(`[${httpMethodType.toUpperCase()}] ${expressPath} `);
      this.expressApp[httpMethodType.toLowerCase()](
        expressPath,
        ...middlewareHandlers,
        async (req, res) => {
          // console.log(`[${type.toUpperCase()}] ${expressPath} `);
          //#region process params
          const args: any[] = [];

          let tBody = req.body;
          let tParams = req.params;
          let tQuery = req.query;

          if (req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_BODY]) {
            try {
              tBody = JSON.parse(
                JSON.stringify(tBody),
                JSON.parse(req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_BODY]),
              );
            } catch (e) {}
          }

          if (req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]) {
            try {
              tQuery = JSON.parse(
                JSON.stringify(tQuery),
                JSON.parse(
                  req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM],
                ),
              );
            } catch (e) {}
          }

          // make class instance from body
          // console.log('req.headers', req.headers)
          if (req.headers[Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS]) {
            try {
              const entity = JSON.parse(
                req.headers[Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS],
              );
              tBody = Mapping.encode(tBody, entity);
            } catch (e) {}
          } else {
            Object.keys(tBody).forEach(paramName => {
              try {
                const entityForParam = JSON.parse(
                  req.headers[
                    `${Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS}${paramName} `
                  ],
                );
                tBody[paramName] = Mapping.encode(
                  tBody[paramName],
                  entityForParam,
                );
              } catch (e) {}
            });
          }

          // make class instance from query params
          // console.log('req.headers', tQuery)
          if (req.headers[Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS]) {
            try {
              const entity = JSON.parse(
                req.headers[Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS],
              );
              tQuery = TaonHelpers.parseJSONwithStringJSONs(
                Mapping.encode(tQuery, entity),
              );
            } catch (e) {}
          } else {
            Object.keys(tQuery).forEach(queryParamName => {
              try {
                const entityForParam = JSON.parse(
                  req.headers[
                    `${Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${queryParamName} `
                  ],
                );
                let beforeTransofrm = tQuery[queryParamName];
                if (_.isString(beforeTransofrm)) {
                  try {
                    const paresed =
                      TaonHelpers.tryTransformParam(beforeTransofrm);
                    beforeTransofrm = paresed;
                  } catch (e) {}
                }
                const afterEncoding = Mapping.encode(
                  beforeTransofrm,
                  entityForParam,
                );
                tQuery[queryParamName] =
                  TaonHelpers.parseJSONwithStringJSONs(afterEncoding);
              } catch (e) {}
            });
          }

          Object.keys(methodConfig.parameters).forEach(paramName => {
            let p: Models.Http.Rest.ParamConfig =
              methodConfig.parameters[paramName];
            if (p.paramType === 'Path' && tParams) {
              args.push(tParams[p.paramName]);
            }
            if (p.paramType === 'Query' && tQuery) {
              if (p.paramName) {
                args.push(tQuery[p.paramName]);
              } else {
                args.push(tQuery);
              }
            }

            if (p.paramType === 'Header' && req.headers) {
              args.push(req.headers[p.paramName.toLowerCase()]);
            }
            if (p.paramType === 'Cookie' && req.cookies) {
              args.push(req.cookies[p.paramName]);
            }
            if (p.paramType === 'Body' && tBody) {
              if (p.paramName && typeof tBody === 'object') {
                args.push(tBody[p.paramName]);
              } else {
                args.push(tBody);
              }
            }
          });
          //#endregion

          const resolvedParams = args
            .reverse()
            .map(v => TaonHelpers.tryTransformParam(v));

          try {
            let result = await getResult(resolvedParams, req, res);
            if (
              result instanceof Blob &&
              (methodConfig.responseType as ModelsNg2Rest.ResponseTypeAxios) ===
                'blob'
            ) {
              // console.log('INSTANCE OF BLOB')
              //#region processs blob result type
              const blob = result as Blob;
              const file = Buffer.from(await blob.arrayBuffer());
              res.writeHead(200, {
                'Content-Type': blob.type,
                'Content-Length': file.length,
              });
              res.end(file);
              //#endregion
            } else if (
              _.isString(result) &&
              (methodConfig.responseType as ModelsNg2Rest.ResponseTypeAxios) ===
                'blob'
            ) {
              // console.log('BASE64')
              //#region process string buffer TODO refacetor
              const img_base64 = result;
              const m = /^data:(.+?);base64,(.+)$/.exec(img_base64);
              if (!m) {
                throw new Error(
                  `[taon - framework] Not a base64 image[${img_base64}]`,
                );
              }
              const [_, content_type, file_base64] = m;
              const file = Buffer.from(file_base64, 'base64');

              res.writeHead(200, {
                'Content-Type': content_type,
                'Content-Length': file.length,
              });
              res.end(file);
              //#endregion
            } else {
              //#region process json request
              await EntityProcess.init(result, res);
              //#endregion
            }
          } catch (error) {
            //#region process error
            if (_.isString(error)) {
              res.status(400).send(
                JSON10.stringify({
                  message: `
    Error inside: ${req.path}

    ${error}

`,
                }),
              );
            } else if (error instanceof Models.Http.Errors) {
              Helpers.error(error, true, false);
              const err: Models.Http.Errors = error;
              res.status(400).send(JSON10.stringify(err));
            } else if (error instanceof Error) {
              const err: Error = error;
              Helpers.error(error, true, false);
              res.status(400).send(
                JSON10.stringify({
                  stack: err.stack,
                  message: err.message,
                }),
              );
            } else {
              Helpers.log(error);
              Helpers.error(
                `[Taon] Bad result isomorphic method: ${error} `,
                true,
                false,
              );
              res.status(400).send(JSON10.stringify(error));
            }
            //#endregion
          }
        },
      );
      //#endregion
    }

    return {
      expressPath: expressPath,
      method: methodConfig.type,
    };
  }
  //#endregion

  //#region methods & getters / init client
  /**
   * client can be browser or nodejs (when remote host)
   */
  private async initClient(
    //#region parameters
    target: Function,
    httpRequestType: Models.Http.Rest.HttpMethod,
    methodConfig: Models.MethodConfig, // Models.Http.Rest.MethodConfig,
    expressPath: string,
    //#endregion
  ): Promise<void> {
    const ctx = this;

    const middlewares = methodConfig.middlewares
      .map(f => this.getInstanceBy(f as any) as BaseMiddleware)
      .filter(f => _.isFunction(f.interceptClientMethod));

    middlewares.forEach(instance => {
      Resource.request.methodsInterceptors.set(
        `${methodConfig.type?.toUpperCase()}-${expressPath}`,
        {
          intercept: ({ req, next }) => {
            return instance.interceptClientMethod(
              {
                req,
                next,
              },
              {
                methodName: methodConfig.methodName,
                expressPath,
                httpRequestType: httpRequestType,
              },
            );
          },
        },
      );
    });

    // : { received: any; /* Rest<any, any>  */ }
    this.logHttp && console.log(`${httpRequestType?.toUpperCase()} ${expressPath} `);
    // console.log('INITING', methodConfig); // TODO inject in static
    //#region resolve storage
    // TODO not a good idea
    const storage = globalThis;
    //#endregion

    const orgMethods = target.prototype[methodConfig.methodName];

    //#region handle electron ipc request

    if (Helpers.isElectron) {
      const ipcRenderer = (window as any).require('electron').ipcRenderer;
      target.prototype[methodConfig.methodName] = function (...args) {
        const received = new Promise(async (resolve, reject) => {
          const headers = {};
          const { request, response } = TaonHelpers.websqlMocks(headers);

          //#region @browser
          ipcRenderer.once(
            TaonHelpers.ipcKeyNameResponse(target, methodConfig, expressPath),
            (event, responseData) => {
              let res: any = responseData;
              console.log({ responseData });
              try {
                const body = res;
                res = new ModelsNg2Rest.HttpResponse(
                  {
                    body: void 0,
                    isArray: void 0 as any,
                    method: methodConfig.type,
                    url: `${ctx.uriOrigin}${
                      '' // TODO express path
                    }${methodConfig.path} `,
                  },
                  Helpers.isBlob(body) || _.isString(body)
                    ? body
                    : JSON.stringify(body),
                  RestHeaders.from(headers),
                  void 0,
                  () => body,
                );

                resolve(res);
              } catch (error) {
                console.error(error);
                reject(error);
              }
            },
          );
          ipcRenderer.send(
            TaonHelpers.ipcKeyNameRequest(target, methodConfig, expressPath),
            args,
          );
          //#endregion
        });
        received['observable'] = from(received);
        return {
          received,
        };
      };
      return;
    }
    //#endregion

    //#region handling web sql request
    //#region @websqlOnly

    //#region resolve variables
    const MIN_TIMEOUT = 500;
    const MIN_TIMEOUT_STEP = 200;

    const globalThisVar = globalThis; // TODO not a good idea! probably should be in context

    const timeout =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_TIMEOUT] || MIN_TIMEOUT;

    let updateFun: Subject<number> =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN];
    if (!globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN]) {
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN] = new Subject();
    }
    updateFun = globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN];

    let startFun: Subject<void> =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START];
    if (!globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START]) {
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START] = new Subject();
    }
    startFun = globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START];

    let doneFun: Subject<void> =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE];
    if (!globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE]) {
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE] = new Subject();
    }
    doneFun = globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE];

    let periodsToUpdate = 0;
    if (timeout >= MIN_TIMEOUT) {
      periodsToUpdate = Math.floor(timeout / MIN_TIMEOUT_STEP);
    }
    //#endregion

    //#region web sql periods to wait
    const periods = async () => {
      startFun.next();
      for (let n = 1; n <= periodsToUpdate; n++) {
        // if (n === 0) {
        // updateFun.next(0)
        // } else {
        let upValue = Math.round(((MIN_TIMEOUT_STEP * n) / timeout) * 100);
        if (upValue > 100) {
          upValue = 100;
        }
        // console.log(`ping upValue: ${ upValue } `)
        updateFun.next(upValue);
        // }
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(void 0);
          }, MIN_TIMEOUT_STEP);
        });
        // console.log('pong')
      }
      doneFun.next();
    };
    //#endregion

    target.prototype[methodConfig.methodName] = function (...args) {
      // if (!target.prototype[methodConfig.methodName][subjectHandler]) {
      //   target.prototype[methodConfig.methodName][subjectHandler] = new Subject();
      // }
      const received = new Promise(async (resolve, reject) => {
        const headers = {};
        const { request, response } = TaonHelpers.websqlMocks(headers);

        let res: any;
        try {
          res = await Helpers.runSyncOrAsync({
            functionFn: orgMethods,
            context: this,
            arrayOfParams: args,
          });
          // console.log({ res1: res })
          if (typeof res === 'function') {
            res = await Helpers.runSyncOrAsync({
              functionFn: res,
              context: this,
              arrayOfParams: [request, response],
            });
          }
          // console.log({ res2: res })
          if (typeof res === 'function') {
            res = await Helpers.runSyncOrAsync({
              functionFn: res,
              context: this,
              arrayOfParams: [request, response],
            });
          }
          // console.log({ res3: res })

          if (typeof res === 'object' && res?.received) {
            res = await res.received;
          }

          const body = res;

          res = new ModelsNg2Rest.HttpResponse(
            {
              body: void 0,
              isArray: void 0 as any,
              method: methodConfig.type,
              url: `${ctx.uriOrigin}${
                '' // TODO express path
              }${methodConfig.path} `,
            },
            Helpers.isBlob(body) || _.isString(body)
              ? body
              : JSON.stringify(body),
            RestHeaders.from(headers),
            void 0,
            () => body,
          );

          // TODO blob should be blob not json
          // console.log('NEXT', res);
          // target.prototype[methodConfig.methodName][subjectHandler].next(res);

          await periods();
          resolve(res);
        } catch (error) {
          await periods();
          console.error(error);
          // error = new Ng2RestModels.HttpResponseError('Error during websql request',
          //   JSON.stringify(error));
          // target.prototype[methodConfig.methodName][subjectHandler].error(error);
          reject(error);
        }
      });
      received['observable'] = from(received);
      // debugger
      if (Helpers.isWebSQL) {
        return {
          received,
        };
      }
    };
    if (Helpers.isWebSQL) {
      return;
    }
    //#endregion
    //#endregion

    //#region handle normal request

    target.prototype[methodConfig.methodName] = function (this: {}, ...args) {
      // console.log('[init method browser] FRONTEND expressPath', expressPath)
      // const productionMode = FrameworkContext.isProductionMode;

      //#region resolve frontend parameters

      if (!storage[Symbols.old.ENDPOINT_META_CONFIG])
        storage[Symbols.old.ENDPOINT_META_CONFIG] = {};
      if (!storage[Symbols.old.ENDPOINT_META_CONFIG][ctx.uriOrigin])
        storage[Symbols.old.ENDPOINT_META_CONFIG][ctx.uriOrigin] = {};
      const endpoints = storage[Symbols.old.ENDPOINT_META_CONFIG];
      let rest: ModelsNg2Rest.ResourceModel<any, any>;
      if (!endpoints[ctx.uriOrigin][expressPath]) {
        let headers = {};
        if (methodConfig.contentType && !methodConfig.responseType) {
          rest = Resource.create(
            ctx.uriOrigin,
            expressPath,
            Symbols.old.MAPPING_CONFIG_HEADER as any,
            Symbols.old.CIRCURAL_OBJECTS_MAP_BODY as any,
            RestHeaders.from({
              'Content-Type': methodConfig.contentType,
              Accept: methodConfig.contentType,
            }),
          );
        } else if (methodConfig.contentType && methodConfig.responseType) {
          rest = Resource.create(
            ctx.uriOrigin,
            expressPath,
            Symbols.old.MAPPING_CONFIG_HEADER as any,
            Symbols.old.CIRCURAL_OBJECTS_MAP_BODY as any,
            RestHeaders.from({
              'Content-Type': methodConfig.contentType,
              Accept: methodConfig.contentType,
              responsetypeaxios: methodConfig.responseType,
            }),
          );
        } else if (!methodConfig.contentType && methodConfig.responseType) {
          rest = Resource.create(
            ctx.uriOrigin,
            expressPath,
            Symbols.old.MAPPING_CONFIG_HEADER as any,
            Symbols.old.CIRCURAL_OBJECTS_MAP_BODY as any,
            RestHeaders.from({
              responsetypeaxios: methodConfig.responseType,
            }),
          );
        } else {
          rest = Resource.create(
            ctx.uriOrigin,
            expressPath,
            Symbols.old.MAPPING_CONFIG_HEADER as any,
            Symbols.old.CIRCURAL_OBJECTS_MAP_BODY as any,
          );
        }

        endpoints[ctx.uriOrigin][expressPath] = rest;
      } else {
        rest = endpoints[ctx.uriOrigin][expressPath] as any;
      }

      const method = httpRequestType.toLowerCase();
      const isWithBody = method === 'put' || method === 'post';
      const pathPrams = {};
      let queryParams = {};
      let bodyObject = {};
      args.forEach((param, i) => {
        let currentParam: Models.Http.Rest.ParamConfig = void 0 as any;

        for (let pp in methodConfig.parameters) {
          let v = methodConfig.parameters[pp];
          if (v.index === i) {
            currentParam = v;
            break;
          }
        }

        if (currentParam.paramType === 'Path') {
          pathPrams[currentParam.paramName] = param;
        }
        if (currentParam.paramType === 'Query') {
          if (currentParam.paramName) {
            const mapping = Mapping.decode(param, !ctx.isProductionMode);
            if (mapping) {
              rest.headers.set(
                `${Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${currentParam.paramName} `,
                JSON.stringify(mapping),
              );
            }
            queryParams[currentParam.paramName] = param;
          } else {
            const mapping = Mapping.decode(param, !ctx.isProductionMode);
            if (mapping) {
              rest.headers.set(
                Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS,
                JSON.stringify(mapping),
              );
            }
            queryParams = _.cloneDeep(param);
          }
        }
        if (currentParam.paramType === 'Header') {
          if (currentParam.paramName) {
            if (currentParam.paramName === Symbols.old.MDC_KEY) {
              // parese MDC
              rest.headers.set(
                currentParam.paramName,
                encodeURIComponent(JSON.stringify(param)),
              );
            } else {
              rest.headers.set(currentParam.paramName, param);
            }
          } else {
            for (let header in param) {
              rest.headers.set(header, param[header]);
            }
          }
        }
        if (currentParam.paramType === 'Cookie') {
          Resource.Cookies.write(
            currentParam.paramName,
            param,
            currentParam.expireInSeconds,
          );
        }
        if (currentParam.paramType === 'Body') {
          if (currentParam.paramName) {
            if (ClassHelpers.getName(bodyObject) === 'FormData') {
              throw new Error(`[taon - framework] Don use param names when posting / putting FormData.
              Use this:
// ...
(@Taon.Http.Param.Body() formData: FormData) ...
// ...

instead
  // ...
  (@Taon.Http.Param.Body('${currentParam.paramName}') formData: FormData) ...
// ...
`);
            }
            const mapping = Mapping.decode(param, !ctx.isProductionMode);
            if (mapping) {
              rest.headers.set(
                `${Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS}${currentParam.paramName} `,
                JSON.stringify(mapping),
              );
            }
            bodyObject[currentParam.paramName] = param;
          } else {
            const mapping = Mapping.decode(param, !ctx.isProductionMode);
            if (mapping) {
              rest.headers.set(
                Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS,
                JSON.stringify(mapping),
              );
            }
            bodyObject = param;
          }
        }
      });

      if (
        typeof bodyObject === 'object' &&
        ClassHelpers.getName(bodyObject) !== 'FormData'
      ) {
        let circuralFromItem = [];
        bodyObject = JSON10.parse(
          JSON10.stringify(bodyObject, void 0, void 0, circs => {
            circuralFromItem = circs;
          }),
        );
        rest.headers.set(
          Symbols.old.CIRCURAL_OBJECTS_MAP_BODY,
          JSON10.stringify(circuralFromItem),
        );
      }

      if (typeof queryParams === 'object') {
        let circuralFromQueryParams = [];
        queryParams = JSON10.parse(
          JSON10.stringify(queryParams, void 0, void 0, circs => {
            circuralFromQueryParams = circs;
          }),
        );

        rest.headers.set(
          Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM,
          JSON10.stringify(circuralFromQueryParams),
        );
      }
      //#endregion

      const httpResultObj = {
        received: isWithBody
          ? rest.model(pathPrams)[method](bodyObject, [queryParams])
          : rest.model(pathPrams)[method]([queryParams]),
      };
      return httpResultObj;
    };
    //#endregion
  }
  //#endregion
}
