//#region imports
import { walk } from 'lodash-walk-object/src';
import { requireDefault } from 'tnp-core/src';
import { CoreModels } from 'tnp-core/src';
import { http, https } from 'tnp-core/src'; // @backend
import { UtilsOs } from 'tnp-core/src';
import { _, Helpers } from 'tnp-core/src';

import { createContext } from './create-context';
import { DITaonContainer } from './dependency-injection/di-container';
import type { EndpointContext } from './endpoint-context';
import { ClassHelpers } from './helpers/class-helpers';
import { TaonInitializationDbNotInitedRetryError } from './helpers/taon-intialize-errors';
import { Models } from './models';
import { RealtimeCore } from './realtime/realtime-core';
import { Symbols } from './symbols';
//#endregion

export class EndpointContextCore {
  constructor(private ctx: EndpointContext) {}

  //#region field & getters
  private injectableTypesfromContexts = [
    Models.ClassType.CONTROLLER,
    Models.ClassType.PROVIDER,
    Models.ClassType.MIDDLEWARE,
    Models.ClassType.REPOSITORY,
    Models.ClassType.SUBSCRIBER,
    Models.ClassType.MIGRATION,
  ];

  public allTypesfromContexts = [
    ...this.injectableTypesfromContexts,
    Models.ClassType.ENTITY,
  ];

  private readonly initFromRecrusiveContextResovle = false;

  public readonly classInstancesByNameObj = {};

  public readonly objWithClassesInstancesArr = {};

  //#endregion

  //#region API / init
  public async init(initOptions?: {
    initFromRecrusiveContextResovle?: boolean;
    onlyMigrationRun?: boolean;
    onlyMigrationRevertToTimestamp?: number;
    overrideHost?: string;
    cloudflareEnv?: any;
  }): Promise<void> {
    initOptions = initOptions || {};

    // @ts-expect-error
    this.ctx.initFromRecrusiveContextResovle =
      !!initOptions.initFromRecrusiveContextResovle;

    if (initOptions.overrideHost) {
      this.ctx.cloneOptions.overrideHost = initOptions.overrideHost;
      delete initOptions.overrideHost;
    }
    // console.log({
    //   'this.ctx.cloneOptions': this.ctx.cloneOptions,
    // });

    if (this.ctx.cloneOptions.overrideContextName) {
      this.ctx.overrideContextName = this.ctx.cloneOptions.overrideContextName;
    }

    //#region @backend
    if (initOptions.cloudflareEnv) {
      // @ts-expect-error
      this.ctx.D1 = initOptions.cloudflareEnv.TAON_D1;
      // @ts-expect-error
      this.ctx.KV = initOptions.cloudflareEnv.TAON_KV;
      // @ts-expect-error
      this.ctx.R2 = initOptions.cloudflareEnv.TAON_R2;

      if (
        !initOptions.initFromRecrusiveContextResovle &&
        this.ctx.isProductionCloudflare
      ) {
        const versionId = initOptions.cloudflareEnv
          .TAON_DEPLOYMENT_ID as string;

        const deploymentInitialized =
          await this.ctx.isDeployedVersion(versionId);
        if (!deploymentInitialized) {
          throw new TaonInitializationDbNotInitedRetryError();
        }
      }
    }
    //#endregion

    this.ctx.inited = true;

    // @ts-expect-error
    this.ctx.onlyMigrationRun = initOptions.onlyMigrationRun;

    // @ts-expect-error
    this.ctx.onlyMigrationRevertToTimestamp =
      initOptions.onlyMigrationRevertToTimestamp;

    this.ctx.config = this.ctx.configFn({});

    if (
      UtilsOs.isRunningInCloudflareWorker() &&
      !initOptions.initFromRecrusiveContextResovle
    ) {
      const TAON_WORKER_INSTANCE_ID = crypto.randomUUID();
      console.log(`

        [WORKER START] instance=${TAON_WORKER_INSTANCE_ID}
        frontendHost: ${this.ctx.config.frontendHost}
        frontendHostPortNumber: ${this.ctx.config.frontendHostPortNumber}
        host: ${this.ctx.config.host}
        hostPortNumber: ${this.ctx.config.hostPortNumber}

        `);
    }

    // @ts-expect-error
    this.ctx.useSession = _.isBoolean(this.ctx.config.useSession)
      ? this.ctx.config.useSession
      : true;

    if (_.isBoolean(this.ctx.cloneOptions.overrideUseSession)) {
      // @ts-expect-error
      this.ctx.useSession = this.ctx.cloneOptions.overrideUseSession;
    }
    // console.log(`[${this.ctx.contextName}] use session=${this.ctx.useSession}`);
    // console.log(`[${this.ctx.contextName}] this.ctx.initFromRecrusiveContextResovle=${this.ctx.initFromRecrusiveContextResovle}`)

    // @ts-expect-error
    this.ctx.abstract = !!this.ctx.config.abstract;

    if (_.isObject(this.ctx.config.database)) {
      this.ctx.config.database = Models.DatabaseConfig.from(
        this.ctx.config.database as Models.DatabaseConfig,
      ).databaseConfigTypeORM;
    }

    if (_.isObject(this.ctx.config.kv_database)) {
      this.ctx.config.kv_database = Models.KVDatabaseConfig.from(
        this.ctx.config.kv_database as Models.KVDatabaseConfig,
      ) as Models.KVDatabaseConfig;
    }

    this.ctx.config.host = this.ctx.host === null ? void 0 : this.ctx.host;

    if (
      this.ctx.config.contexts &&
      this.ctx.config.contexts[this.ctx.contextName]
    ) {
      throw new Error(`You are injecting ${this.ctx.contextName} into itself.`);
    }

    if (
      this.ctx.cloneOptions.overrideHost &&
      !this.ctx.cloneOptions.useAsRemoteContext
    ) {
      // @ts-expect-error
      this.ctx.abstract = false;
      this.ctx.config.host = this.ctx.cloneOptions.overrideHost;
    }

    if (
      this.ctx.cloneOptions.overrideRemoteHost &&
      this.ctx.cloneOptions.useAsRemoteContext
    ) {
      // @ts-expect-error
      this.ctx.abstract = false;
      this.ctx.config.host = this.ctx.cloneOptions.overrideRemoteHost;
    }

    if (
      this.ctx.config.host &&
      !this.ctx.config.host.startsWith('http://') &&
      !this.ctx.config.host.startsWith('https://')
    ) {
      Helpers.throwError(
        `[taon-config] Your${
          this.ctx.host ? ' remote' : ''
        } 'host' must start with http:// or https://`,
      );
    }

    if (_.isUndefined(this.ctx.config.useIpcWhenElectron)) {
      this.ctx.config.useIpcWhenElectron = true;
    }
    // console.log(`config for ${this.ctx.contextName}`, this.ctx.config);

    //#region resolve if skipping writing server routes
    //@ts-expect-error overriding readonly
    this.ctx.skipWritingServerRoutes = _.isBoolean(
      this.ctx.config.skipWritingServerRoutes,
    )
      ? this.ctx.config.skipWritingServerRoutes
      : false;
    //#endregion

    //#region resolve mode
    if (UtilsOs.isRunningInCloudflareWorker()) {
      this.ctx.mode = 'backend-frontend(cloudflare)';
    } else {
      if (this.ctx.config.host) {
        this.ctx.mode = 'backend-frontend(tcp+udp)';
        //#region @websqlOnly
        this.ctx.mode = 'backend-frontend(websql)';
        //#endregion
      }

      if (this.ctx.isRemoteHost) {
        this.ctx.mode = 'remote-backend(tcp+udp)';
      }

      // console.log(`

      //   useIpcWhenElectron: ${this.ctx.config.useIpcWhenElectron}
      //   UtilsOs.isElectron: ${UtilsOs.isElectron}

      //   `)
      if (this.ctx.config.useIpcWhenElectron && UtilsOs.isElectron) {
        if (UtilsOs.isWebSQL) {
          this.ctx.mode = 'backend-frontend(websql-electron)';
        } else {
          this.ctx.mode = 'backend-frontend(ipc-electron)';
        }
      }

      // mode === undefined for TaonBaseContext => ok behavior
      // console.log(`Mode for BE/FE communication: ${this.ctx.mode}`);
      // if(!this.ctx.mode) {
      //   console.log(this.ctx.config)
      // }
    }
    //#endregion

    //#region throw error when no mode detected and non abstract context
    if (!this.ctx.mode && !this.ctx.abstract) {
      const errMsg =
        `You need to provide host property or ` +
        `useIpcWhenElectron or mark it as abstract`;
      Helpers.error(
        `[taon][Context=${this.ctx.contextName}]: ${errMsg}`,
        false,
        true,
      );
      //#region @backend
      process.exit(1);
      //#endregion
    }
    //#endregion

    //#region resolve kv database config
    if (this.ctx.config.kv_database === true) {
      this.ctx.logFramework &&
        console.log(`

        ASSIGNING AUTO GENERATED KV DATABASE CONFIG

        `);
      this.ctx.kvDatabaseConfig = this.ctx.getAutoGeneratedKvDbConfig();
    } else if (_.isObject(this.ctx.config.database)) {
      this.ctx.logFramework &&
        console.log(`

        OVERRIDE KV DATABASE CONFIG FROM CONFIGURATION

        `);
      this.ctx.kvDatabaseConfig = this.ctx.getAutoGeneratedKvDbConfig();
      walk.Object(
        this.ctx.config.database as any,
        (value, lodashPath) => {
          if (_.isNil(value) || _.isFunction(value) || _.isObject(value)) {
            // skipping
          } else {
            this.ctx.logFramework &&
              console.info(
                `Overriding kv database config: ${lodashPath}=${value}`,
              );
            _.set(this.ctx.databaseConfig, lodashPath, value);
          }
        },
        {
          walkGetters: false,
        },
      );
    }
    //#endregion

    //#region resolve database config
    if (this.ctx.config.database === true) {
      this.ctx.logFramework &&
        console.log(`

        ASSIGNING AUTO GENERATED DATABASE CONFIG

        `);
      this.ctx.databaseConfig = this.ctx.getAutoGeneratedSqlDbConfig();
    } else if (_.isObject(this.ctx.config.database)) {
      this.ctx.logFramework &&
        console.log(`

        OVERRIDE DATABASE CONFIG FROM CONFIGURATION

        `);
      this.ctx.databaseConfig = this.ctx.getAutoGeneratedSqlDbConfig();
      walk.Object(
        this.ctx.config.database as any,
        (value, lodashPath) => {
          if (_.isNil(value) || _.isFunction(value) || _.isObject(value)) {
            // skipping
          } else {
            this.ctx.logFramework &&
              console.info(
                `Overriding database config: ${lodashPath}=${value}`,
              );
            _.set(this.ctx.databaseConfig, lodashPath, value);
          }
        },
        {
          walkGetters: false,
        },
      );
    }
    //#endregion

    //#region resolve session
    if (this.ctx.useSession && !this.initFromRecrusiveContextResovle) {
      // console.log(`Apply with credetinoal for [${this.ctx.contextName}]`);
      // this.ctx.session = _.cloneDeep(this.ctx.config.session);
      // const oneHour = 1000 * 60 * 60 * 1; // 24;
      // if (!this.ctx.session.cookieMaxAge) {
      //   this.ctx.session.cookieMaxAge = oneHour;
      // }
      // serever and browser cookie authentication
      // axios.defaults.withCredentials = true;
    }
    //#endregion

    //#region prepare & gather all classes recursively
    this.ctx.config.contexts = this.ctx.config.contexts || {};
    this.ctx.config.entities = this.ctx.config.entities || {};
    this.ctx.config.controllers = this.ctx.config.controllers || {};
    this.ctx.config.repositories = this.ctx.config.repositories || {};
    this.ctx.config.providers = this.ctx.config.providers || {};
    this.ctx.config.subscribers = this.ctx.config.subscribers || {};
    this.ctx.config.migrations = this.ctx.config.migrations || {};

    this.ctx.config.entities = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.ENTITY,
      )),
      ...this.ctx.config.entities,
    };

    this.ctx.config.controllers = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.CONTROLLER,
      )),
      ...this.ctx.config.controllers,
    };

    this.ctx.config.providers = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.PROVIDER,
      )),
      ...this.ctx.config.providers,
    };

    this.ctx.config.middlewares = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.MIDDLEWARE,
      )),
      ...this.ctx.config.middlewares,
    };

    this.ctx.config.subscribers = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.SUBSCRIBER,
      )),
      ...this.ctx.config.subscribers,
    };

    this.ctx.config.repositories = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.REPOSITORY,
      )),
      ...this.ctx.config.repositories,
    };

    this.ctx.config.migrations = {
      ...(await this.getRecrusiveClassesfromContextsObj(
        Models.ClassType.MIGRATION,
      )),
      ...this.ctx.config.migrations,
    };

    // console.log(this.ctx.config);
    // debugger;
    //#endregion

    //#region prepare classes instances/functions clones
    this.ctx.config.controllers = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.controllers,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.CONTROLLER,
    });
    this.ctx.config.repositories = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.repositories,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.REPOSITORY,
    });
    this.ctx.config.providers = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.providers,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.PROVIDER,
    });
    this.ctx.config.middlewares = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.middlewares,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.MIDDLEWARE,
    });

    this.ctx.config.subscribers = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.subscribers,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.SUBSCRIBER,
    });

    this.ctx.config.migrations = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.migrations,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.MIGRATION,
    });

    this.ctx.config.entities = this.cloneClassesObjWithNewMetadata({
      classesInput: this.ctx.config.entities,
      config: this.ctx.config,
      ctx: this.ctx,
      classType: Models.ClassType.ENTITY,
    });
    //#endregion

    //#region prepare instances
    for (const classTypeName of this.injectableTypesfromContexts) {
      this.classInstancesByNameObj[classTypeName] = {};
      this.objWithClassesInstancesArr[classTypeName] = [];
    }

    for (const classTypeName of this.injectableTypesfromContexts) {
      await this.createInstances(
        this.ctx.config[Models.ClassTypeKey[classTypeName]],
        classTypeName,
      );
    }
    //#endregion

    if (!this.ctx.isRunOrRevertOnlyMigrationAppStart) {
      //#region prepares server
      if (this.ctx.mode === 'backend-frontend(tcp+udp)' && !this.ctx.abstract) {
        //#region @backend
        if (UtilsOs.isRunningInCloudflareWorker()) {
          this.ctx.logFramework &&
            Helpers.info(`Using cloudflare fake express server`);
        } else {
          let express: typeof import('express');
          express = requireDefault('express');

          this.ctx.expressApp = express();

          if (process.env.NODE_ENV === 'production') {
            this.ctx.expressApp.set('trust proxy', 1);
          }

          await this.ctx.initBackendMiddlewares();
          await this.ctx.initCustomBackendMiddlewares();
          const shouldStartHttpsSecureServer =
            this.ctx.isHttpServer && !this.ctx.isRunningInsideDocker;
          this.ctx.logFramework &&
            Helpers.info(`

          Starting server ${
            shouldStartHttpsSecureServer ? 'with' : 'without'
          } HTTPS secure server

          `);
          this.ctx.serverTcpUdp = shouldStartHttpsSecureServer
            ? new https.Server(
                {
                  key: this.ctx.config.https?.key,
                  cert: this.ctx.config.https?.cert,
                },
                this.ctx.expressApp,
              )
            : new http.Server(this.ctx.expressApp);

          this.ctx.trackServer(this.ctx.serverTcpUdp);
          this.ctx.publicAssets.forEach(asset => {
            this.ctx.expressApp.use(
              asset.serverPath,
              express.static(asset.locationOnDisk),
            );
          });
        }

        //#endregion

        await this.ctx.initCustomClientMiddlewares();
      }
      //#endregion

      //#region prepare realtime
      if (!this.ctx.abstract) {
        this.ctx.disabledRealtime = !!(
          UtilsOs.isRunningInCloudflareWorker() ||
          this.ctx.config.disabledRealtime
        );
        if (!this.ctx.host) {
          throw `

            host is required for context initialization..
            (Or maybe you forgot mark ${this.ctx.config.contextName} context as abstract?)

          `;
        }

        //#region @backend
        // if (UtilsOs.isRunningInCliMode() && !_.isNil(this.ctx.config.disabledRealtime)) {
        //   // TODO for now...
        //   Helpers.logInfo(`Realtime disable on backend for cli mode`);
        //   this.ctx.disabledRealtime = true;
        // } else {
        //   Helpers.logInfo(`Realtime enabled on backend`);
        // }
        //#endregion

        this.ctx.logRealtime &&
          Helpers.info(
            `[ctx=${this.ctx.contextName}] Init Realtime for ${this.ctx.mode}`,
          );

        this.ctx.realtime = new RealtimeCore(this.ctx);
      }
      //#endregion
    }

    //#region show context info
    // console.log({ ref })
    if (this.ctx.abstract) {
      this.ctx.logFramework &&
        Helpers.info(
          `[taon] Create abstract context: ${this.ctx.config.contextName}`,
        );
    } else {
      if (this.ctx.isRemoteHost) {
        this.ctx.logFramework &&
          Helpers.info(
            `[taon] Create context for remote host: ${this.ctx.config.host}`,
          );
      } else {
        this.ctx.logFramework &&
          Helpers.info(
            `[taon] Create context for host: ${this.ctx.config.host}`,
          );
      }
    }
    //#endregion

    // update first exposed config
    Object.keys(this.ctx.config).forEach(key => {
      this.ctx.originalConfig[key] = this.ctx.config[key];
    });
  }
  //#endregion

  //#region methods & getters

  //#region methods & getters / clone class
  private cloneClassWithNewMetadata = <
    T extends { new (...args: any[]): any },
  >({
    TaonBaseClass,
    className,
    config,
    ctx,
    classType,
  }: {
    TaonBaseClass: T;
    className: string;
    config: Models.ContextOptions<any, any, any, any, any, any, any, any>;
    ctx: EndpointContext;
    classType: Models.ClassType;
  }): T => {
    // Return a new class that extends the base class
    const cloneClass = () => {
      if (
        TaonBaseClass[Symbols.fullClassNameStaticProperty] ===
        `${ctx.contextName}.${className}`
      ) {
        return TaonBaseClass;
      }
      return class extends TaonBaseClass {
        // static ['_'] = TaonBaseClass['_'];

        static [CoreModels.OrignalClassKey] = TaonBaseClass;

        static [Symbols.fullClassNameStaticProperty] = `${ctx.contextName}.${className}`;

        static [CoreModels.ClassNameStaticProperty] = className;

        static [Symbols.ctxInClassOrClassObj] = ctx;

        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
        static __getFullPathForClass__(arr = []) {
          const name = this[Symbols.fullClassNameStaticProperty];
          arr.push(name);

          if (
            this[CoreModels.OrignalClassKey] &&
            (
              this[CoreModels.OrignalClassKey] as any as {
                __getFullPathForClass__: any;
              }
            ).__getFullPathForClass__
          ) {
            (
              this[CoreModels.OrignalClassKey] as any as {
                __getFullPathForClass__: any;
              }
            ).__getFullPathForClass__(arr);
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
    // if (_.isUndefined(TaonBaseClass[Symbols.orignalClassClonesObj])) {
    //   TaonBaseClass[Symbols.orignalClassClonesObj] = {};
    // }
    // const all = {
    //   ...TaonBaseClass[Symbols.orignalClassClonesObj],
    //   ...cloneClassFunction[Symbols.orignalClassClonesObj],
    // };
    // all[ctx.contextName] = cloneClassFunction;
    // cloneClassFunction[Symbols.orignalClassClonesObj] = all;
    // TaonBaseClass[Symbols.orignalClassClonesObj] = all;
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
      const TaonBaseClass = classesInput[key];

      if (!TaonBaseClass) {
        Helpers.error(`Class ${key} is not defined in context ${ctx.contextName}

        Please check if you have correct import in context file

        `);
      }

      var className = Reflect.getMetadata(
        Symbols.metadata.className,
        TaonBaseClass,
      );

      // console.log('Metadata className', className, TaonBaseClass);
      // if (!className) {
      //   console.warn(`Please provide className for ${TaonBaseClass.name} class`);
      // }
      className = className || key;
      TaonBaseClass[CoreModels.ClassNameStaticProperty] = className;

      const clonedClass = this.cloneClassWithNewMetadata({
        TaonBaseClass,
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
    const contexts = Object.values(
      this.ctx.config.contexts || {},
    ) as ReturnType<typeof createContext>[];
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
          config: this.ctx.config,
          ctx: this.ctx,
          classType,
        }),
      );
      // console.log(`${classType} clonedClasses`, clonedClasses);
      clonedClasses.forEach(c => arr.push(c));

      await ref.endpointCore.getRecrusiveClassesfromContexts(classType, arr);
    }
    return arr as Function[];
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
      this.ctx.config[Models.ClassTypeKey[classType]][className] = classFn;
      this.objWithClassesInstancesArr[classType].push(instance);
      const endpointContextClass = (await import('./endpoint-context'))
        .EndpointContext;
      instance[Symbols.taonInstanceId] = endpointContextClass.instanceID++;
      this.ctx.allClassesInstances[className] = instance;
    }
  }
  //#endregion

  //#endregion
}
