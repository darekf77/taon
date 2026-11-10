//#region imports
import type { Server } from 'http';
import type { Socket } from 'net';
import { URL } from 'url'; // @backend

import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from '@cloudflare/workers-types';
import type { Application } from 'express';
import { Resource } from 'ng2-rest/src';
import type { Repository } from 'taon-typeorm/src'; // @websql
import { EventSubscriber } from 'taon-typeorm/src'; // @websql
import { Entity as TypeormEntity } from 'taon-typeorm/src'; // @websql
import { DataSource, DataSourceOptions } from 'taon-typeorm/src';
import { GlobalStorage } from 'tnp-core/src';
import { path, requireDefault } from 'tnp-core/src';
import { CoreModels } from 'tnp-core/src';
import { fse } from 'tnp-core/src'; // @backend
import { UtilsOs, Utils } from 'tnp-core/src';
import { crossPlatformPath } from 'tnp-core/src';
import { _, Helpers } from 'tnp-core/src';

import type { TaonBaseController } from './base-classes/base-controller';
import type { TaonBaseMiddleware } from './base-classes/base-middleware';
import type { TaonBaseRepository } from './base-classes/base-repository';
import { createFakeExpressApp } from './cloudflare/cloudflare-express-fake-server';
import type { ControllerConfig } from './config/controller-config';
import { MethodConfig } from './config/method-config';
import { apiPrefix } from './constants';
import { TaonBaseRepositoryClassName } from './constants';
import { ContextDbMigrations } from './context-db-migrations';
import { TaonEntityOptions } from './decorators/classes/entity-decorator';
import { TaonSubscriberOptions } from './decorators/classes/subscriber-decorator';
import { EndpointClient } from './endpoint-client';
import { EndpointContextCore } from './endpoint-context-core';
import type { ContextsEndpointStorage } from './endpoint-context-storage';
import { EndpointServer } from './endpoint-server';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressResponse,
} from './express-types';
import { ClassHelpers } from './helpers/class-helpers';
import { TaonHelpers } from './helpers/taon-helpers';
import { Models } from './models';
import { RealtimeCore } from './realtime/realtime-core';
import { expostHeadersCross, Symbols } from './symbols';
import { TaonAdmin } from './ui/taon-admin-mode-configuration/taon-admin.service'; // @browser

//#endregion

export class EndpointContext {
  //#region fields
  static instanceID = 0;

  public readonly endpointServer = new EndpointServer(this);

  public readonly endpointClient = new EndpointClient(this);

  public readonly endpointCore = new EndpointContextCore(this);

  /**
   * JUST FOR TESTING PURPOSES
   */
  public readonly USE_MARIADB_MYSQL_IN_DOCKER: boolean = false;

  //#region fields / cloudflare
  public readonly R2: R2Bucket;

  public readonly D1: D1Database;

  public readonly KV: KVNamespace;
  //#endregion

  //#region fields / flags
  disabledRealtime: boolean = false;

  public readonly abstract: boolean;

  /**
   * check whether context is inited
   * (with init() function )
   */
  public inited: boolean = false;
  //#endregion

  //#region fields / db migrations
  readonly dbMigrations = new ContextDbMigrations(this);
  //#endregion

  //#region fields / local instance obj symbol
  private readonly localInstaceObjSymbol = Symbol('localInstaceObjSymbol');
  //#endregion

  //#region fields / all instances of classes from context
  /**
   * all instances of classes from context
   * key is class name
   */
  public readonly allClassesInstances = {};
  //#endregion

  //#region fields / active routes
  public readonly activeRoutes: {
    expressPath: string;
    method: CoreModels.HttpMethod;
  }[] = [];
  //#endregion

  //#region fields / typeorm repositories
  //#region @websql
  public repos = new Map<string, Repository<any>>();
  //#endregion
  //#endregion

  //#region fields / source context
  get sourceContext(): EndpointContext | undefined {
    return this.cloneOptions?.sourceContext;
  }
  //#endregion

  //#region fields / skip writing server routes
  public readonly skipWritingServerRoutes: boolean = false;
  //#endregion

  //#region fields / express app
  public expressApp: Application = {} as any;
  //#endregion

  //#region fields / server tcp udp
  public serverTcpUdp: Server;

  public sockets = new Set<Socket>();

  public trackServer(server: Server): void {
    //#region @backendFunc
    server.on('connection', socket => {
      const key = `${socket.remoteAddress}:${socket.remotePort} -> ${socket.localAddress}:${socket.localPort}`;
      this.logSocketConnections && console.log('NEW CONNECTION', key);

      this.sockets.add(socket);

      if (this.logSocketConnections) {
        socket.on('close', () => {
          console.log('SOCKET CLOSED', key);
          this.sockets.delete(socket);
        });

        socket.on('end', () => {
          console.log('SOCKET END', key);
        });

        socket.on('error', err => {
          console.log('SOCKET ERROR', key, err?.message);
        });
      }
    });
    //#endregion
  }
  //#endregion

  //#region fields / database config
  databaseConfig?: Models.DatabaseConfigTypeOrm;

  kvDatabaseConfig?: Models.KVDatabaseConfig;
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

  //#region fields / connection
  public connection: DataSource;
  //#endregion

  //#region fields / entities triggers
  private entitiesTriggers = {};
  //#endregion

  //#region fields / realtime
  private _realtime: RealtimeCore;

  get realtime(): RealtimeCore {
    if (!this._realtime) {
      throw new Error(`Please initialize context before accessing
        .realtime.client or realtime.server properties.

        `);
    }
    return this._realtime;
  }

  set realtime(v) {
    this._realtime = v;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  get realtimeClient() {
    return this.realtime.client;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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

  //#endregion

  //#region constructor
  /**
   * Inside docker there is not need for https secure server
   */
  public readonly isRunningInsideDocker: boolean = false;

  constructor(
    public originalConfig: Models.ContextOptions<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >,
    public configFn: (
      env: any,
    ) => Models.ContextOptions<any, any, any, any, any, any, any, any>,
    /**
     * (@default: false)
     * If TRUE context is NOT going to create db/express server/http endpoints
     * PURPOSE OF THIS PROPERTY
     * -> ONLY remote access from backend or frontend to specific backend
     */
    public readonly cloneOptions: Models.TaonCtxCloneParams,
  ) {
    this.cloneOptions = this.cloneOptions || {};
    this.isRunningInsideDocker = UtilsOs.isRunningInDocker();
    if (UtilsOs.isRunningInCloudflareWorker()) {
      this.expressApp = createFakeExpressApp();
    }
  }
  //#endregion

  //#region methods & getters / is only gathering sql from migrations
  get isOnlyGatheringSQLFromMigraitons(): boolean {
    return GlobalStorage.get('DISPLAY_RAW_SQL_COMMANDS') === 'true';
  }
  //#endregion

  //#region methods & getters / logs
  get logHttp(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).http;
    }
    return this.config?.logs === true;
  }

  get logSocketConnections(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs)
        .socketConnections;
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

  get logRoutes(): boolean {
    if (_.isObject(this.config?.logs)) {
      return !!(this.config.logs as Models.ConnectionOptionsLogs).routes;
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

  //#region methods & getters / is production cloudflre
  get isProductionCloudflare(): boolean {
    const isProductionCloudfalre =
      UtilsOs.isRunningInCloudflareWorker() &&
      !GlobalStorage.get('TAON_LOCAL_DEV');

    return isProductionCloudfalre;
  }
  //#endregion

  //#region methods & getters / is deployed version
  async isDeployedVersion(deploymentVerison: string): Promise<boolean> {
    //#region @backendFunc
    if (!deploymentVerison) {
      console.error(`[taon][isDeployedVersion] deploymentVersion is empty`);
      return false;
    }
    try {
      const result = await this.D1.prepare(
        `SELECT 1 FROM TaonCloudfalreDeployment WHERE deploymentVersion = ? LIMIT 1`,
      )
        .bind(deploymentVerison)
        .first();

      return result !== null;
    } catch (error) {
      return false;
    }

    //#endregion
    return true;
  }
  //#endregion

  //#region methods & getters / get auto generated config
  public getAutoGeneratedKvDbConfig(): Models.KVDatabaseConfig {
    return Models.KVDatabaseConfig.from({});
  }

  public getAutoGeneratedSqlDbConfig(): Models.DatabaseConfigTypeOrm {
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
        //   recreateMode: 'PRESERVE_DATA__RUN_MIGRATIONS',
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

        if (!Helpers.exists(path.dirname(this.sqlLiteDbLocation))) {
          Helpers.mkdirp(path.dirname(this.sqlLiteDbLocation));
        }
        databaseConfig = databaseConfig = Models.DatabaseConfig.from({
          location: this.sqlLiteDbLocation,
          type: 'sqljs',
          useLocalForage: false,
          recreateMode: 'PRESERVE_DATA__RUN_MIGRATIONS',
          logging: true,
        });

        //#region @backend
        if (!fse.existsSync(locationOfTheDatabase)) {
          databaseConfig.recreateMode = 'DROP_DB__RUN_MIGRATIONS';
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
            dbLocationInOs = this.electronDbLocation;
            if (!Helpers.exists(path.dirname(this.electronDbLocation))) {
              Helpers.mkdirp(path.dirname(this.electronDbLocation));
            }
          }
          //#endregion

          databaseConfig = Models.DatabaseConfig.from({
            location: UtilsOs.isElectron
              ? dbLocationInOs
              : `db-${this.contextName}.sqlite`,
            type: 'sqljs',
            recreateMode: 'DROP_DB__RUN_MIGRATIONS',
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
            TaonAdmin.Instance?.keepWebsqlDbDataAfterReload(); // TODO @LAST
          //#endregion

          // console.log({keepWebsqlDbDataAfterReload})

          databaseConfig = databaseConfig = Models.DatabaseConfig.from({
            location: `db-${this.contextName}.sqlite`,
            type: 'sqljs',
            useLocalForage: true, // !!window['localforage'], // TODO this need to be checked in runtime
            recreateMode: keepWebsqlDbDataAfterReload
              ? 'PRESERVE_DATA__RUN_MIGRATIONS'
              : 'DROP_DB__RUN_MIGRATIONS',
            logging: this.logDb,
          });
          break;
        //#endregion

        //#region resolve database config for mode backend-frontend(tcp+udp)
        case 'backend-frontend(cloudflare)':
          databaseConfig = Models.DatabaseConfig.from({
            // location: this.sqlLiteDbLocation,
            // @ts-ignore
            type: 'd1',
            // database: this.D1,
            recreateMode: 'DROP_DB__RUN_MIGRATIONS',
            logging: this.logDb,
          });
          break;

        case 'backend-frontend(tcp+udp)':
          if (!Helpers.exists(path.dirname(this.sqlLiteDbLocation))) {
            Helpers.mkdirp(path.dirname(this.sqlLiteDbLocation));
          }

          databaseConfig = Models.DatabaseConfig.from({
            database: `context-db-${this.contextName}`,
            location: this.sqlLiteDbLocation,
            type: 'sqljs',
            recreateMode: 'DROP_DB__RUN_MIGRATIONS',
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

  //#region methods & getters / sql lite db location
  get sqlLiteDbLocation(): string {
    //#region @backendFunc

    if (this.frontendHostUri.origin.includes('://localhost:')) {
      return crossPlatformPath([
        process.cwd(),
        `${Models.DatabasesFolder}/sqlite/sqlite-${this.contextName}.sqlite`,
      ]);
    }

    return crossPlatformPath([
      UtilsOs.getRealHomeDir(),
      `.taon/databases-sqlite-for-apps/${
        this.appId || _.snakeCase(process.cwd()).replace(/\_/, '.')
      }/${this.contextName}.sqlite`,
    ]);
    //#endregion
  }
  //#endregion

  //#region methods & getters / electron db location
  get electronDbLocation(): string {
    //#region @backendFunc
    // if (this.frontendHostUri.origin.includes('://localhost:')) {
    //   return crossPlatformPath([
    //     process.cwd(),
    //     `${Models.DatabasesFolder}/electron/electron-${this.contextName}.sqlite`,
    //   ]);
    // }

    return crossPlatformPath([
      UtilsOs.getRealHomeDir(),
      `.taon/databases-for-electron-apps/${
        this.appId || _.snakeCase(process.cwd()).replace(/\_/, '.')
      }/${this.contextName}.sqlite`,
    ]);
    //#endregion
  }
  //#endregion

  //#region methods & getters / kv db json location base
  private get kvDbJsonLocationBase(): string {
    //#region @backendFunc
    let baseLocation: string;

    if (this.frontendHostUri.origin.includes('://localhost:')) {
      baseLocation = crossPlatformPath([
        process.cwd(),
        `${Models.DatabasesFolder}/kv`,
      ]);
    } else {
      baseLocation = crossPlatformPath([
        UtilsOs.getRealHomeDir(),
        `.taon/databases-kv-for-apps/${
          this.appId || _.snakeCase(process.cwd()).replace(/\_/, '.')
        }`,
      ]);
    }

    return baseLocation;
    //#endregion
  }
  //#endregion

  //#region methods & getters / kv db json location base
  public get bucketFileDbLocationBase(): string {
    //#region @backendFunc
    let baseLocation: string;

    if (this.frontendHostUri.origin.includes('://localhost:')) {
      baseLocation = crossPlatformPath([
        process.cwd(),
        `${Models.DatabasesFolder}/bucket`,
      ]);
    } else {
      baseLocation = crossPlatformPath([
        UtilsOs.getRealHomeDir(),
        `.taon/databases-bucket-for-apps/${
          this.appId || _.snakeCase(process.cwd()).replace(/\_/, '.')
        }`,
      ]);
    }

    return baseLocation;
    //#endregion
  }
  //#endregion

  //#region methods & getters / kv db json location based folder location
  get kvDbJsonLocationBaseFolderLocation(): string {
    //#region @backendFunc
    if (_.isFunction(this.kvDatabaseConfig?.dbLocationFn)) {
      return crossPlatformPath(
        path.dirname(
          this.kvDatabaseConfig?.dbLocationFn({
            contextName: this.contextName,
            baseLocation: this.kvDbJsonLocationBase,
            ctx: this,
            cwd: this.cwd,
            port: this.uriPort,
            repositoryClassName: 'AnyTaonClassName',
          }),
        ),
      );
    }
    return this.kvDbJsonLocationBase;
    //#endregion
  }
  //#endregion

  //#region methods & getters / get kv db json location for class
  kvDbJsonLocationForClass(className: string): string {
    //#region @backendFunc

    if (_.isFunction(this.kvDatabaseConfig?.dbLocationFn)) {
      return this.kvDatabaseConfig?.dbLocationFn({
        contextName: this.contextName,
        baseLocation: this.kvDbJsonLocationBase,
        ctx: this,
        cwd: this.cwd,
        port: this.uriPort,
        repositoryClassName: className,
      });
    }

    return crossPlatformPath([
      this.kvDbJsonLocationBaseFolderLocation,
      `kv-${this.contextName}__${className}.json`,
    ]);
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
      this.mode === 'backend-frontend(cloudflare)' ||
      this.mode === 'backend-frontend(ipc-electron)'
    );
  }
  //#endregion

  //#region methods & getters / get class instances by class type
  getClassInstanceObjBy(classType: Models.ClassType): any {
    return this.endpointCore.classInstancesByNameObj[classType];
  }
  //#endregion

  //#region methods & getters / get class instances arr
  private getClassesInstancesArrBy(classType: Models.ClassType): any[] {
    return this.endpointCore.objWithClassesInstancesArr[classType];
  }
  //#endregion

  //#region methods & getters / inject
  getInstanceBy<T>(
    ctor: new (...args: any[]) => T,
    options?: {
      resolveClassFromContext?: string;
    },
  ): T {
    options = options || ({} as any);

    // const rawConfigs = ClassHelpers.getControllerConfigs(ctor);

    let entityResolveFn = void 0;

    if (options.resolveClassFromContext === TaonBaseRepositoryClassName) {
      const entity = ctor;
      entityResolveFn = () => entity;
      ctor = this.getClassFunByClassName(TaonBaseRepositoryClassName) as any;
    }

    // TODO make it faster
    const isTypeormCustomRepository = ClassHelpers.hasParentClassWithName(
      ctor,
      TaonBaseRepositoryClassName,
    );

    const className = ClassHelpers.getName(ctor);

    // console.log(`${className}  isRepo ${isTypeormCustomRepository}`);

    ctor = this.getClassFunByClassName(className) as any;

    if (!ctor) {
      throw new Error(`Not able to inject "${className}" inside context "${this.contextName}"

      Make sure they share the same context or import context where "${className}" is defined.

      `);
    }

    //#region handle custom repository
    if (isTypeormCustomRepository) {
      let entityName: string = '';

      entityResolveFn = entityResolveFn
        ? entityResolveFn
        : () => {
            const classToProcess =
              this.allClassesInstances[ClassHelpers.getName(ctor)];

            return classToProcess.entityClassResolveFn();
          };

      // entity thing is only for repositories local repositories

      const entity = entityResolveFn && entityResolveFn();
      entityName = (entity && ClassHelpers.getName(entity)) || '';
      // console.log(`entityName `, entityName);
      // }

      if (!this[this.localInstaceObjSymbol]) {
        this[this.localInstaceObjSymbol] = {};
      }
      const instanceKey = className + (entityName ? `.${entityName}` : '');

      const existed = this[this.localInstaceObjSymbol][instanceKey];

      if (existed) {
        // console.log(
        //   `EXISTED ${ClassHelpers.getName(options.parentInstanceThatWillGetInjectedStuff)} Inject ${className} instanceKey "${instanceKey}"`,
        // );
        return existed;
      }

      // console.log(
      //   `NEW ${ClassHelpers.getName(options.parentInstanceThatWillGetInjectedStuff)} Inject ${className} instanceKey "${instanceKey}"`,
      // );

      // @ts-expect-error
      const injectedInstance = new (ctor as any as typeof TaonBaseRepository)(
        entityResolveFn,
      );
      this[this.localInstaceObjSymbol][instanceKey] = injectedInstance;
      // console.log(`injectedInstance `, existed)
      return injectedInstance;
    }
    //#endregion

    const contextScopeInstance = this.allClassesInstances[className];

    // if (className === 'TopicController') {
    //   debugger;
    // }
    return contextScopeInstance;
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
    for (const classTypeName of this.endpointCore.allTypesfromContexts) {
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

  //#region methods & getters / init repositories
  async initRepositories(): Promise<void> {
    if (this.isRemoteHost) {
      return;
    }
    //#region @websql

    if (this.connection) {
      for (const classFun of this.getClassFunByArr(
        Models.ClassType.ENTITY,
      ) as any[]) {
        const repo = (await this.connection.getRepository(
          ClassHelpers.getOrginalClass(classFun),
        )) as any;
        this.repos.set(ClassHelpers.getName(classFun), repo);
      }
    } else {
      if (!this.config.kv_database) {
        Helpers.warn(
          `Skipping db init for ${this.contextName}.Use database:true to enable db.`,
        );
      }
    }

    //#endregion
  }
  //#endregion

  //#region methods & getters / init classes
  async initClassesLowDashInitFunction(): Promise<void> {
    if (this.isRemoteHost) {
      return;
    }

    for (const classTypeName of [
      Models.ClassType.MIDDLEWARE,
      Models.ClassType.PROVIDER,
      Models.ClassType.REPOSITORY,
      Models.ClassType.CONTROLLER,
      Models.ClassType.SUBSCRIBER,
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
      : `${globalThis?.location?.protocol || 'http:'}//${
          this.config?.frontendHost
        }`;
    const uri = new URL(url.replace(/\/$/, ''));
    return uri;
  }

  get uri(): URL | undefined {
    const url = this.host ? new URL(this.host) : void 0;
    return url;
  }
  //#endregion

  //#region methods & getters / host uri protocol
  get uriProtocol(): string | undefined {
    return this.uri?.protocol;
  }
  //#endregion

  //#region methods & getters / host uri origin
  /**
   * Examples
   * http://localhost:3000
   * https://localhost (from localhost:80)   *
   */
  get uriOrigin(): string | undefined {
    return this.uri?.origin;
  }
  //#endregion

  //#region methods & getters / host uri pathname
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
  //#endregion

  //#region methods & getters / uri pathname or nothing if root
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
  //#endregion

  //#region methods & getters / port from uri
  get uriPort(): string | undefined {
    if (!this.uri?.origin?.includes('localhost')) {
      return this.config?.hostPortNumber?.toString();
    }
    return this.uri?.port;
  }
  // TODO do i need 2 getters for port?

  /**
   * Port from uri as number
   * @returns {Number | undefined}
   */
  get port(): Number | undefined {
    return this.uri?.port ? Number(this.uriPort) : undefined;
  }
  //#endregion

  //#region methods & getters / is https server
  get isHttpServer() {
    return this.uriProtocol === 'https:';
  }
  //#endregion

  //#region methods & getters / is remote host
  /**
   * Check if context is for remote only
   */
  public get isRemoteHost(): boolean {
    return !!this.cloneOptions?.useAsRemoteContext;
  }
  //#endregion

  //#region methods & getters / context name
  public overrideContextName: string;

  public readonly useSession: boolean = false;

  /**
   * ipc/udp needs this
   */
  public get contextName(): string {
    if (this.overrideContextName) {
      return this.overrideContextName;
    }
    // console.log(this.originalConfig);
    return this.config?.contextName || this.originalConfig?.contextName;
  }
  //#endregion

  //#region methods & getters / context name for communication
  /**
   * ipc/udp needs this
   */
  public get contextNameForCommunication(): string {
    let contextName = this.contextName;
    if (this.isRemoteHost) {
      if (this.overrideContextName) {
        contextName = this.overrideContextName;
      } else {
        if (this.sourceContext?.contextName) {
          contextName = this.sourceContext?.contextName;
        } else {
          // console.log(
          //   `CANT GET SOURCE CONTEXT NAME FOR REMOTE CONTEXT ${this.contextName}`,
          // );
        }
      }
    }
    return contextName;
  }
  //#endregion

  //#region methods & getters / get context type
  /**
   * Check context type
   */
  public get contextType(): 'normal' | 'remote' | 'abstract' | 'invalid' {
    if (this.abstract) {
      return 'abstract';
    }
    if (this.host) {
      return this.isRemoteHost ? 'remote' : 'normal';
    }
    return 'invalid';
  }
  //#endregion

  //#region methods & getters / current working directory
  public get cwd(): string {
    return this.config.cwd || process.cwd();
  }
  //#endregion

  //#region methods & getters / active context
  public get activeContext(): string | null {
    return this.config.activeContext || null;
  }
  //#endregion

  //#region methods & getters / app id
  public get appId(): string {
    return this.config.appId;
  }
  //#endregion

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

  //#region methods & getters / is Localhost

  public get isLocalhostBackend(): boolean {
    const originUrl = this.frontendHostUri;
    return (
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1' ||
      originUrl.hostname === '[::1]'
    );
  }
  //#endregion

  //#region methods & getters / host

  get host(): string | undefined {
    return this.config.host;
  }
  //#endregion

  //#region methods & getters / origin
  get origin(): string | undefined {
    return this.uri?.origin;
  }
  //#endregion

  //#region methods & getters / init subscribers
  /**
   * init typeorm subscribers
   */
  async initSubscribers() {
    //#region @websqlFunc
    if (this.isRemoteHost) {
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
    if (this.isRemoteHost) {
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
            `[taon][typeorm] don't create table for entity "${nameForEntity}" ? '${createTable}'`,
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
      const server = this.serverTcpUdp;

      if (this.logSocketConnections) {
        server.getConnections((err, count) => {
          console.log('connections before close', { err, count });
        });
      }

      server.close();

      server.closeIdleConnections?.();
      server.closeAllConnections?.();

      for (const socket of this.sockets) {
        socket.destroy();
      }

      await new Promise<void>((resolve, reject) => {
        server.once('close', () => {
          this.logSocketConnections && console.log('server deleted');
          resolve();
        });

        server.once('error', reject);
      });

      this.sockets.clear();
      delete this.serverTcpUdp;
    }
    delete this.expressApp;
    this.logFramework && console.log(`Done destroying ${this.contextName}`);
    //#endregion
  }
  //#endregion

  //#region methods & getters / init connection
  async initDatabaseConnection(): Promise<void> {
    //#region @websqlFunc
    if (this.isRemoteHost || !this.databaseConfig) {
      return;
    }

    if (!UtilsOs.isRunningInCloudflareWorker()) {
      if (!Helpers.exists(this.kvDbJsonLocationBaseFolderLocation)) {
        Helpers.mkdirp(this.kvDbJsonLocationBaseFolderLocation);
      }
    }

    const entities = this.getClassFunByArr(Models.ClassType.ENTITY)
      .map(entityFn => {
        return ClassHelpers.getOrginalClass(entityFn);
      })
      .filter(entityClassFn => {
        const options = Reflect.getMetadata(
          Symbols.metadata.options.entity,
          entityClassFn,
        ) as TaonEntityOptions;
        const createTable = _.isUndefined(options.createTable)
          ? true
          : options.createTable;

        return createTable;
      });

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

    const dropSchema =
      this.isProductionCloudflare || this.isRunOrRevertOnlyMigrationAppStart
        ? false
        : this.databaseConfig.dropSchema;

    this.logFramework && console.log(`DROP SCHEMA: ${dropSchema}`);

    //#region recreate kv repos json files
    if (dropSchema && !UtilsOs.isRunningInCloudflareWorker()) {
      const kvClass = await import('./base-classes/base-kv-repository');
      const kvSyncClass =
        await import('./base-classes/base-kv-sync-repository');

      const repos = this.getClassesInstancesArrBy(Models.ClassType.REPOSITORY);
      for (const repo of repos) {
        const repoClassName = ClassHelpers.getName(repo);
        // console.log({ repoClassName });

        if (
          repo instanceof kvClass.TaonBaseKvRepository ||
          repo instanceof kvSyncClass.TaonBaseKvSyncRepository
        ) {
          Helpers.writeJson(this.kvDbJsonLocationForClass(repoClassName), {});
        }
      }
    }
    //#endregion

    const dataSourceDbConfig = _.isObject(this.databaseConfig)
      ? ({
          type: this.databaseConfig.type,
          port: this.databaseConfig.databasePort,
          host: this.databaseConfig.databaseHost,
          database: UtilsOs.isRunningInCloudflareWorker()
            ? this.D1
            : (this.databaseConfig.database as any),
          username: this.databaseConfig.databaseUsername,
          password: this.databaseConfig.databasePassword,
          useLocalForage: this.databaseConfig.useLocalForage,
          // I am not using typeorm migration system
          entities,
          subscribers,
          synchronize:
            this.isProductionCloudflare ||
            this.isRunOrRevertOnlyMigrationAppStart
              ? false
              : this.databaseConfig.synchronize,
          autoSave,
          dropSchema,
          logging:
            this.isOnlyGatheringSQLFromMigraitons ||
            !!this.databaseConfig.logging,
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

  //#region methods & getters / update class calculate path
  private updateCalculatedPathsForControllers(
    rawConfigs: ControllerConfig[],
    classConfig: ControllerConfig,
    controllerClassFn: Function,
  ): void {
    const parentsCalculatedPath = _.slice(rawConfigs, 1)
      .reverse()
      .map(bc => {
        if (TaonHelpers.isGoodPath(bc.path)) {
          return bc.path;
        }
        return bc.className;
      })
      .join('/');

    const contextNameForCommunication = this.contextNameForCommunication;

    if (TaonHelpers.isGoodPath(classConfig.path)) {
      classConfig.calculatedPath = classConfig.path;
    } else {
      classConfig.calculatedPath = (
        `${this.uriPathnameOrNothingIfRoot}` +
        `/${apiPrefix}/${contextNameForCommunication}/tcp${parentsCalculatedPath}/` +
        `${ClassHelpers.getName(controllerClassFn)}`
      )
        .replace(/\/\//g, '/')
        .split('/')
        .reduce((acc, bc) => {
          return _.last(acc) === bc ? acc : [...acc, bc];
        }, [])
        .join('/');
    }

    // console.log('calculatedPath', classConfig.calculatedPath);
  }
  //#endregion

  //#region methods & getters / dedupe class configs
  private mergeControllerMethodsConfigs(
    rawConfigs: ControllerConfig[],
    classConfig: ControllerConfig,
    controllerClassFn: Function,
  ): void {
    const currentControllerMethodsConfig = classConfig.methods;

    _.slice(rawConfigs, 1).forEach(bc => {
      const parentControllerMethods = _.cloneDeep(bc.methods);

      for (const methodsName in parentControllerMethods) {
        if (parentControllerMethods.hasOwnProperty(methodsName)) {
          if (!currentControllerMethodsConfig[methodsName]) {
            //#region add non existed method
            const methodConfig = parentControllerMethods[methodsName];
            currentControllerMethodsConfig[methodsName] = methodConfig;
            //#endregion
          }
        }
      }
    });
  }

  //#endregion

  //#region methods & getters / init controllers hook
  async initControllersHook(
    ctxStorage: ContextsEndpointStorage,
  ): Promise<void> {
    if (this.isRunOrRevertOnlyMigrationAppStart) {
      return;
    }
    const allControllers = this.getClassFunByArr(Models.ClassType.CONTROLLER);
    for (const controllerClassFn of allControllers) {
      const instance = this.getInstanceBy(
        controllerClassFn as any,
      ) as TaonBaseController;
      // @ts-expect-error
      if (_.isFunction(instance.afterAllCtxInited)) {
        // @ts-expect-error
        await instance.afterAllCtxInited({ ctxStorage });
      }
    }
  }
  //#endregion

  //#region methods & getters / init controllers
  initControllers(intOpt: { overrideExpressApp: Application }): void {
    if (this.isRunOrRevertOnlyMigrationAppStart) {
      return;
    }
    const allControllers = this.getClassFunByArr(Models.ClassType.CONTROLLER);
    // debugger
    // console.log('allControllers', allControllers);
    for (const controllerClassFn of allControllers) {
      // this.logFramework &&
      //   Helpers.info(
      //     `Initing controller ${ClassHelpers.getName(controllerClassFn)}`,
      //   );
      // console.log(ClassHelpers.getClassConfig(controllerClassFn));

      // const controllerName = ClassHelpers.getName(controllerClassFn);

      // console.log(
      //   `for ${controllerName}`,
      //   ClassHelpers.getClassConfig(controllerClassFn),
      // );

      controllerClassFn[Symbols.classMethodsNames] =
        ClassHelpers.getMethodsNames(controllerClassFn);

      const rawConfigs = ClassHelpers.getControllerConfigs(controllerClassFn);
      // console.log(controllerName, { rawConfigs });
      // console.log(`Class config for ${ClassHelpers.getName(controllerClassFn)}`, configs)
      const classConfig: ControllerConfig = rawConfigs[0];

      this.updateCalculatedPathsForControllers(
        rawConfigs,
        classConfig,
        controllerClassFn,
      );
      this.mergeControllerMethodsConfigs(
        rawConfigs,
        classConfig,
        controllerClassFn,
      );

      //#region combine middlewares from controllers
      classConfig.calculatedMiddlewaresControllerObj = {};
      [...rawConfigs].reverse().forEach(rc => {
        if (_.isFunction(rc.middlewares)) {
          classConfig.calculatedMiddlewaresControllerObj = rc.middlewares({
            parentMiddlewares: classConfig.calculatedMiddlewaresControllerObj,
            className(middlewareClass) {
              return ClassHelpers.getName(controllerClassFn);
            },
          });
        }
      });
      //#endregion

      //#region group start
      //#region @backend
      if (!UtilsOs.isRunningInCliMode()) {
        //#endregion
        this.logRoutes &&
          console.groupCollapsed(
            `[taon][express-server] routes [${classConfig.className}]`,
          );
        //#region @backend
      }
      //#endregion
      //#endregion

      //#region init client or server methods
      const methodNames = _.isArray(classConfig.allowedMethods)
        ? Object.keys(classConfig.methods).filter(methodName =>
            classConfig.allowedMethods.includes(methodName),
          )
        : Object.keys(classConfig.methods);

      // console.log({
      //   ctxname: this.contextName,
      //   ctrl: ClassHelpers.getName(controllerClassFn),
      //   methodNames,
      // });
      for (const methodName of methodNames) {
        const methodConfig: Partial<MethodConfig> =
          classConfig.methods[methodName];

        //#region combine all class methods middlewares
        let calculatedMiddlewaresMethodObj = {};

        [...rawConfigs].reverse().forEach(rc => {
          if (rc.methods[methodName]) {
            const parentMethodConfig = rc.methods[methodName];

            if (_.isFunction(parentMethodConfig.middlewares)) {
              calculatedMiddlewaresMethodObj = parentMethodConfig.middlewares({
                parentMiddlewares: calculatedMiddlewaresMethodObj,
                className(middlewareClass) {
                  return ClassHelpers.getName(controllerClassFn);
                },
              });
            }
          }
        });

        // add class middlewares to method middlewares
        methodConfig.calculatedMiddlewaresMethodObj = {
          ...calculatedMiddlewaresMethodObj,
          ...classConfig.calculatedMiddlewaresControllerObj,
        };
        methodConfig.calculatedMiddlewares = Object.values(
          methodConfig.calculatedMiddlewaresMethodObj || {},
        );
        //#endregion

        // methodConfig.calculatedMiddlewares = TODO

        //#region initialized method express path
        const httpMethodType: CoreModels.HttpMethod = methodConfig.type;

        // this is quick fix - in docker global path should not be used
        const expressPath = this.getExpressPath(classConfig, methodConfig);

        //#endregion

        //#region init server
        // console.log({
        //   expressPath,
        //   globalPathPart,
        //   'this.contextName': this.contextName,
        // });

        const controllerInstance = this.getInstanceBy(
          controllerClassFn as any,
        ) as TaonBaseController;

        if (UtilsOs.isNode || UtilsOs.isWebSQL) {
          //#region @websql

          // @ts-ignore
          controllerInstance.__config__ = classConfig;

          const route = this.endpointServer.initServer(
            httpMethodType,
            methodConfig,
            classConfig,
            expressPath,
            controllerClassFn,
            intOpt.overrideExpressApp,
          );

          this.activeRoutes.push({
            expressPath: route.expressPath,
            method: route.method,
          });
          //#endregion
        }
        //#endregion

        //#region init client
        const shouldInitClient =
          UtilsOs.isBrowser || this.isRemoteHost || UtilsOs.isWebSQL;
        // console.log('shouldInitClient', shouldInitClient);
        if (shouldInitClient) {
          // console.log(
          //   'initClient',
          //   ClassHelpers.getFullInternalName(controllerClassFn),
          //   type,
          //   methodConfig,
          //   expressPath,
          // );

          // @ts-ignore
          controllerInstance.__config__ = classConfig;

          this.endpointClient.initClient(
            controllerClassFn,
            httpMethodType,
            methodConfig as any,
            expressPath,
          );
        }
        //#endregion
      }
      //#endregion

      //#region group end
      //#region @backend
      if (!UtilsOs.isRunningInCliMode()) {
        //#endregion
        this.logRoutes && console.groupEnd();
        //#region @backend
      }
      //#endregion
      //#endregion
    }
  }

  //#endregion

  //#region methods & getters / get express path
  getExpressPath(
    classConfig: ControllerConfig,
    methodConfig: Partial<MethodConfig>,
  ): string {
    const globalPathPart =
      this.isRunningInsideDocker ||
      !this.frontendHostUri?.origin?.includes('localhost') // fe with domain -> is in docker
        ? `${this.uriPathnameOrNothingIfRoot.replace(
            /\/$/,
            '',
          )}/${apiPrefix}/${this.contextName}`.replace(/\/\//, '/')
        : '';
    const expressPath = methodConfig.global
      ? `${globalPathPart}/${methodConfig.path?.replace(/\/$/, '')}`.replace(
          /\/\//,
          '/',
        )
      : TaonHelpers.getExpressPath(classConfig, methodConfig);

    return expressPath;
  }
  //#endregion

  //#region methods & getters / write active routes
  public writeActiveRoutes(): void {
    if (this.isRemoteHost || this.isRunOrRevertOnlyMigrationAppStart) {
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
      if (method.toUpperCase() === 'GET' && this.isRunningInsideDocker) {
        this.logRoutes &&
          console.log(
            `apk add curl && curl http://localhost:${this.uriPort}${expressPath}`,
          );
      }

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

    const routerName = `routes/routes-${this.config.contextName}.rest`;
    const fileName = UtilsOs.isRunningInCloudflareWorker()
      ? crossPlatformPath([routerName])
      : crossPlatformPath([
          //#region @backend
          process.cwd(),
          //#endregion
          routerName,
        ]);

    this.logFramework && console.log(`[taon] routes file: ${fileName} `);
    this.logRoutes && console.log(routes);
    //#region @backend
    if (
      !UtilsOs.isRunningInCloudflareWorker() &&
      !UtilsOs.isElectron &&
      !this.skipWritingServerRoutes
    ) {
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

  public async initCustomClientMiddlewares(): Promise<void> {
    const middlewares = this.getClassesInstancesArrBy(
      Models.ClassType.MIDDLEWARE,
    )
      .map(f => f as TaonBaseMiddleware)
      .filter(f => _.isFunction(f.interceptClient));

    middlewares.forEach(middlewareInstanceName => {
      const contextName = this.contextName;
      const interceptorName = `${contextName}-${ClassHelpers.getName(
        middlewareInstanceName,
      )}`;
      Resource.globalInterceptors.set(interceptorName, {
        intercept: ({ req, next }) => {
          const url = new URL(req.url);
          if (
            url.pathname.startsWith(
              `${this.uriPathnameOrNothingIfRoot}/${apiPrefix}/${contextName}/`,
            )
          ) {
            // console.log('intercepting', url.pathname, req);
            return middlewareInstanceName.interceptClient({
              req,
              next,
            });
          }
          return next.handle(req);
        },
      });
    });
  }

  public async initCustomBackendMiddlewares(): Promise<void> {
    //#region @backend
    const app = this.expressApp;
    const middlewares = this.getClassesInstancesArrBy(
      Models.ClassType.MIDDLEWARE,
    );

    for (const middleware of middlewares) {
      const middlewareInstance: TaonBaseMiddleware = middleware as any;
      if (_.isFunction(middlewareInstance.interceptServer)) {
        const middlewareFn = ClassHelpers.asyncHandler(
          async (
            req: ExpressRequest,
            res: ExpressResponse,
            next: ExpressNextFunction,
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

  public async initBackendMiddlewares(): Promise<void> {
    //#region @backend
    if (UtilsOs.isRunningInCloudflareWorker()) {
      return;
    }

    let bodyParser: typeof import('body-parser');
    let cookieParser: typeof import('cookie-parser');
    let cors: typeof import('cors');

    let methodOverride: typeof import('method-override');
    // let expressSession: typeof import('express-session');

    bodyParser = requireDefault('body-parser');
    cookieParser = requireDefault('cookie-parser');
    cors = requireDefault('cors');

    methodOverride = requireDefault('method-override');
    // expressSession = requireDefault('express-session');

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
    app.use(
      bodyParser.json({
        verify: (req: ExpressRequest, _res, body) => {
          req.rawBody = body;
          // if (/stripe[-_/]?webhook/i.test(req.url ?? '')) {
          //   (req as ExpressRequest).rawBody = body;
          // }
        },
      }),
    );
    app.use(methodOverride());
    app.use(cookieParser());

    if (this.useSession) {
      Helpers.info(
        '[taon][express-server] session enabled for this context ' +
          this.contextName,
      );
      // const { cookieMaxAge } = this.session;
      const frontendHost = this.config.frontendHost;

      // const sessionObj = {
      //   frontendHost,
      //   secret: 'mysecretsessioncookithing',
      //   saveUninitialized: true,
      //   cookieMaxAge,
      //   secure: frontendHost.startsWith('https://'),
      //   resave: false,
      // } as Models.ISession;

      app.use(
        cors({
          credentials: true,
          origin: frontendHost,
        }),
      );
      // app.use(expressSession(sessionObj));
      this.logFramework &&
        console.log(`

      CORS ENABLED FOR SESSION ${frontendHost}

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

        res.set('Access-Control-Expose-Headers', expostHeadersCross.join(', '));
        next();
      });
    })();

    //#endregion
  }
  //#endregion
}
