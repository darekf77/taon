//#region imports
import { Helpers } from 'tnp-core/src';
import { EndpointContext } from './endpoint-context';
import { Models } from './models';
import { FiredevAdmin } from './firedev-admin';
import { ENV } from './env';
// import { Symbols } from './symbols';
// import { Firedev } from 'firedev/src';
//#endregion

export const createContext = <
  //#region context generic args
  CTX extends Record<string, object>,
  CTRL extends Record<string, new (...args: any[]) => any>,
  ENTITY extends Record<string, new (...args: any[]) => any>,
  REPO extends Record<string, new (...args: any[]) => any>,
  PROVIDER extends Record<string, new (...args: any[]) => any>,
  SUBSCRIBER extends Record<string, new (...args: any[]) => any>,
  //#endregion
>(
  configFn: (
    env: any,
  ) => Models.ContextOptions<CTX, CTRL, ENTITY, REPO, PROVIDER, SUBSCRIBER>,
) => {
  let config = configFn(ENV);
  // if (config.logFramework) {
  //   console.log(`[firedev][${config.contextName}] framework config`, {
  //     config,
  //   });
  // }
  const endpointContextRef = new EndpointContext(config, configFn);
  // const entitiesCache = {};
  // const controllersCache = {};

  const res = {
    //#region types
    types: {
      // get entities() {
      //   return config.entities;
      // },
      // entitiesFor(classInstace: BaseInjector) {
      //   const ctx = classInstace.__endpoint_context__;
      //   if (!entitiesCache[ctx.contextName]) {
      //     entitiesCache[ctx.contextName] = {};
      //     for (const entityClassName of Object.keys(config.entities)) {
      //       entitiesCache[ctx.contextName][entityClassName] =
      //         config.entities[entityClassName][
      //           Firedev.symbols.orignalClassClonesObj
      //         ][ctx.contextName];
      //     }
      //   }
      //   return entitiesCache[ctx.contextName] as typeof config.entities;
      // },
      get controllers() {
        return config.controllers;
      },
      // controllesFor(classInstace?: BaseInjector) {
      //   const ctx = classInstace.__endpoint_context__ || endpointContextRef;
      //   if (!controllersCache[ctx.contextName]) {
      //     controllersCache[ctx.contextName] = {};
      //     for (const controllerName of Object.keys(config.controllers)) {
      //       controllersCache[ctx.contextName][controllerName] =
      //         config.controllers[controllerName][
      //           Firedev.symbols.orignalClassClonesObj
      //         ][ctx.contextName];
      //     }
      //   }
      //   return controllersCache[ctx.contextName] as typeof config.controllers;
      // },
      get repositories() {
        return config.repositories;
      },
      get providers() {
        return config.providers;
      },
      get subscribers() {
        return config.subscribers;
      },
    },
    //#endregion
    //#region contexts
    get contexts() {
      return config.contexts;
    },
    get contextName() {
      return config.contextName;
    },
    //#endregion
    //#region context
    /**
     * - get reference to internal context
     */
    async ref() {
      if (!endpointContextRef.inited) {
        await endpointContextRef.init({
          initFromRecrusiveContextResovle: true,
        });
      }
      return endpointContextRef;
    },
    get refSync() {
      return endpointContextRef;
    },
    get<T>(ctor:  new (...args: any[]) => T): new (...args: any[]) => T {
      const classFun = endpointContextRef.getClassFunByClass(
        ctor,
      );
      return classFun as any;

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
    },
    //#endregion
    //#region initialize
    /**
     * - create controller instances for context
     * - init database (if enable) + migation scripts
     */
    initialize: async (): Promise<EndpointContext> => {
      return await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          await endpointContextRef.init();
          if (config.abstract) {
            throw new Error(`Abstract context can not be initialized`);
          }
          await endpointContextRef.initEntities();
          await endpointContextRef.initDatabaseConnection();
          await endpointContextRef.initSubscribers();
          endpointContextRef.initMetadata();
          endpointContextRef.startServer();
          //#region @websql
          endpointContextRef.writeActiveRoutes();
          //#endregion

          await endpointContextRef.initClasses();
          if (
            FiredevAdmin.Instance.keepWebsqlDbDataAfterReload &&
            !Helpers.isNode
          ) {
            Helpers.info(`[firedev] Keep websql data after reload`);
          } else {
            await endpointContextRef.reinitControllers();
          }
          resolve(endpointContextRef);
        });
      });
    },
    //#endregion
  };
  return res;
};
//#endregion
