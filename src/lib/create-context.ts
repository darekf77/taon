//#region imports
import { CoreModels, Helpers, UtilsOs, _ } from 'tnp-core/src';

import { EndpointContext } from './endpoint-context';
import { Models } from './models';
import { TaonAdminService } from './ui/taon-admin-mode-configuration/taon-admin.service'; // @browser
import { ContextsEndpointStorage } from './endpoint-context-storage';
//#endregion

/**
 * @returns function that returns context function.
 * Context function can be used to dynamically
 * create context with specific configuration.
 */
export const createContextTemplate = <
  //#region context generic args
  CTX extends Record<string, object>,
  CTRL extends Record<string, new (...args: any[]) => any>,
  ENTITY extends Record<string, new (...args: any[]) => any>,
  REPO extends Record<string, new (...args: any[]) => any>,
  PROVIDER extends Record<string, new (...args: any[]) => any>,
  SUBSCRIBER extends Record<string, new (...args: any[]) => any>,
  MIGRATION extends Record<string, new (...args: any[]) => any>,
  MIDDLEWARE extends Record<string, new (...args: any[]) => any>,
  //#endregion
>(
  configFn: (
    env: any,
  ) => Models.ContextOptions<
    CTX,
    CTRL,
    ENTITY,
    REPO,
    PROVIDER,
    SUBSCRIBER,
    MIGRATION,
    MIDDLEWARE
  >,
) => {
  return () => {
    return createContext<
      CTX,
      CTRL,
      ENTITY,
      REPO,
      PROVIDER,
      SUBSCRIBER,
      MIGRATION,
      MIDDLEWARE
    >(configFn);
  };
};

/**
 * REQURIED PROPERTY:
 * - contextName
 */
const createContextFn = <
  //#region context generic args
  CTX extends Record<string, object>,
  CTRL extends Record<string, new (...args: any[]) => any>,
  ENTITY extends Record<string, new (...args: any[]) => any>,
  REPO extends Record<string, new (...args: any[]) => any>,
  PROVIDER extends Record<string, new (...args: any[]) => any>,
  SUBSCRIBER extends Record<string, new (...args: any[]) => any>,
  MIGRATION extends Record<string, new (...args: any[]) => any>,
  MIDDLEWARES extends Record<string, new (...args: any[]) => any>,
  //#endregion
>(
  configFn: (
    env: any,
  ) => Models.ContextOptions<
    CTX,
    CTRL,
    ENTITY,
    REPO,
    PROVIDER,
    SUBSCRIBER,
    MIGRATION,
    MIDDLEWARES
  >,
  cloneOptions: Models.TaonCtxCloneParams,
) => {
  cloneOptions = cloneOptions || {};
  let config = configFn({});
  // console.log(
  //   `

  //   [Taon] Creating context ${config.contextName}...`,
  //   {config},
  // );
  const endpointContextRef = new EndpointContext(
    config,
    configFn,
    cloneOptions,
  );

  const res = {
    //#region contexts
    get contextName() {
      return config.contextName;
    },
    //#endregion

    get appId() {
      return config.appId;
    },

    cloneAsRemote: (cloneOpt?: { overrideRemoteHost?: string }) => {
      cloneOpt = cloneOpt || {};
      const opt: Models.TaonCtxCloneParams = {
        ...cloneOpt,
        sourceContext: endpointContextRef,
        useAsRemoteContext: true,
      };
      return createContextFn(configFn, opt);
    },

    cloneAsNormal: (cloneOpt?: { overrideHost?: string }) => {
      cloneOpt = cloneOpt || {};
      const opt: Models.TaonCtxCloneParams = {
        ...cloneOpt,
        sourceContext: endpointContextRef,
        useAsRemoteContext: false,
      };
      return createContextFn(configFn, opt);
    },

    //#region context
    /**
     * @deprecated
     * - get reference to internal context
     */
    async __ref() {
      if (!endpointContextRef.inited) {
        await endpointContextRef.init({
          initFromRecrusiveContextResovle: true,
        });
      }
      return endpointContextRef;
    },
    /**
     * only for internal use
     * @deprecated
     */
    get __refSync() {
      return endpointContextRef;
    },
    getClassInstance<T>(ctor: new (...args: any[]) => T): T {
      return endpointContextRef.getInstanceBy(ctor);
    },

    getClass<T>(ctor: new (...args: any[]) => T): new (...args: any[]) => T {
      const classFun = endpointContextRef.getClassFunByClass(ctor);
      return classFun as any;
      //#region old
      // TODO hmmmm for now context for controller inside api service
      // const allContexts = Object.values(classFun[Symbols.orignalClassClonesObj] || {}).map(classFn => {
      //   return {
      //     ctx: classFn[Symbols.ctxInClassOrClassObj] as EndpointContext,
      //     classFn,
      //   }
      // })
      // const activeContext = allContexts.find(c => c.ctx.inited);
      // debugger
      // console.log('activeContext', activeContext.ctx.contextName);
      // return activeContext.ctx.getClassFunByClass(ctor) as any;
      //#endregion
    },
    //#endregion
    //#region initialize
    /**
     * - create controller instances for context
     * - init database (if enable) + migation scripts
     */
    initialize: async (
      overrideOptions?: Models.TaonInitializeParams,
    ): Promise<EndpointContext> => {
      return await new Promise(async (resolve, reject) => {
        //#region init in set timeout
        setTimeout(async () => {
          if (UtilsOs.isRunningInDocker()) {
            const activeContext = config?.activeContext || null;
            if (
              _.isString(activeContext) &&
              activeContext !== '' &&
              activeContext !== config?.contextName
            ) {
              console.warn(
                `[taon] Context ${endpointContextRef.contextName} is not active context, skipping initialization.`,
              );
              resolve(endpointContextRef);
              return;
            }
          }

          await endpointContextRef.init({
            ...overrideOptions,
          });

          if (config.abstract) {
            throw new Error(`Abstract context can not be initialized`);
          }

          await endpointContextRef.initEntities();
          await endpointContextRef.initSubscribers();

          await endpointContextRef.initDatabaseConnection();

          await endpointContextRef.dbMigrations.ensureMigrationTableExists();

          // console.log(
          //   'connection subscribers',
          //   endpointContextRef?.connection?.subscribers,
          // );
          // debugger;
          await endpointContextRef.initControllers();
          await endpointContextRef.startServer();
          //#region @websql
          endpointContextRef.writeActiveRoutes();
          //#endregion

          await endpointContextRef.initClasses();
          if (endpointContextRef.databaseConfig) {
            //#region handle websql reload data
            //#region @browser
            let keepWebsqlDbDataAfterReload = false;
            keepWebsqlDbDataAfterReload =
              TaonAdminService.Instance?.keepWebsqlDbDataAfterReload;

            if (keepWebsqlDbDataAfterReload) {
              !UtilsOs.isRunningInCliMode() &&
                Helpers.info(
                  `[taon] Keeping websql data after reload ` +
                    `(context=${endpointContextRef.contextName}).`,
                );
            } else {
              Helpers.info(
                `[taon] Dropping all tables and data ` +
                  `(context=${endpointContextRef.contextName}).`,
              );
            }
            //#endregion
            //#endregion

            //#region TODO this may be usefull but for now
            // 2 separate contexts are fine
            // const shouldStartRemoteHost = endpointContextRef.mode !== 'remote-backend(tcp+udp)';
            // if(shouldStartRemoteHost) {
            //   const endpointContextRemoteHostRef = new EndpointContext(config, configFn);
            //   await endpointContextRemoteHostRef.init({
            //     overrideRemoteHost: endpointContextRef.host,
            //     overrideHost: null,
            //   });
            //   endpointContextRemoteHostRef.initMetadata();

            //   endpointContextRef.__contextForControllerInstanceAccess = endpointContextRemoteHostRef;
            // }
            //#endregion

            //#region run migrations tasks
            if (endpointContextRef.onlyMigrationRun) {
              endpointContextRef.logMigrations &&
                Helpers.log(
                  `[taon] Running only migrations (context=${endpointContextRef.contextName}).`,
                );
              await endpointContextRef.dbMigrations.runAllNotCompletedMigrations();
            } else if (endpointContextRef.onlyMigrationRevertToTimestamp) {
              endpointContextRef.logMigrations &&
                Helpers.log(
                  `[taon] Reverting migrations to timestamp ${
                    endpointContextRef.onlyMigrationRevertToTimestamp
                  } (context=${endpointContextRef.contextName}).`,
                );
              await endpointContextRef.dbMigrations.revertMigrationToTimestamp(
                endpointContextRef.onlyMigrationRevertToTimestamp,
              );
            } else {
              endpointContextRef.logMigrations &&
                Helpers.log(
                  `[taon] Running all not applied migrations (context=${endpointContextRef.contextName}).`,
                );
              await endpointContextRef.dbMigrations.runAllNotCompletedMigrations();
            }
            //#endregion
          }

          ContextsEndpointStorage.Instance.set(endpointContextRef);

          resolve(endpointContextRef);
        });
        //#endregion
      });
    },
    /**
     * realtime communication with server
     * TCP(upgrade) socket.io (or ipc) based.
     */
    get realtime() {
      return {
        get client() {
          return endpointContextRef.realtimeClient;
        },
        get server() {
          return endpointContextRef.realtimeServer;
        },
      };
    },
  };
  return res;
};
//#endregion

export const createContext = <
  //#region context generic args
  CTX extends Record<string, object>,
  CTRL extends Record<string, new (...args: any[]) => any>,
  ENTITY extends Record<string, new (...args: any[]) => any>,
  REPO extends Record<string, new (...args: any[]) => any>,
  PROVIDER extends Record<string, new (...args: any[]) => any>,
  SUBSCRIBER extends Record<string, new (...args: any[]) => any>,
  MIGRATION extends Record<string, new (...args: any[]) => any>,
  MIDDLEWARES extends Record<string, new (...args: any[]) => any>,
  //#endregion
>(
  configFn: (
    env: any,
  ) => Models.ContextOptions<
    CTX,
    CTRL,
    ENTITY,
    REPO,
    PROVIDER,
    SUBSCRIBER,
    MIGRATION,
    MIDDLEWARES
  >,
) => {
  return createContextFn(configFn, { useAsRemoteContext: false });
};

export type TaonContext = ReturnType<typeof createContext>;

// const AA = createContext(() => ({ contextName: 'aa' }));
// const BB = AA.cloneAsRemoteContext();
