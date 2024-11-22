//#region imports
import { Helpers } from 'tnp-core/src';
import { EndpointContext } from './endpoint-context';
import { Models } from './models';

import { ENV } from './env';
//#region @browser
import { TaonAdmin } from './ui/taon-admin-mode-configuration/taon-admin.service';
//#endregion

// import { Symbols } from './symbols';
// import { Taon } from 'taon/src';
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

  const endpointContextRef = new EndpointContext(config, configFn);

  const res = {
    //#region types
    types: {
      //#region entites for
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
      //           Taon.symbols.orignalClassClonesObj
      //         ][ctx.contextName];
      //     }
      //   }
      //   return entitiesCache[ctx.contextName] as typeof config.entities;
      // },
      //#endregion
      get controllers() {
        return config.controllers;
      },
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
    initialize: async (overrideOptions?: {
      overrideHost?: string;
      overrideRemoteHost?: string;
    }): Promise<EndpointContext> => {
      return await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
          await endpointContextRef.init({
            ...overrideOptions,
          });

          if (config.abstract) {
            throw new Error(`Abstract context can not be initialized`);
          }

          await endpointContextRef.initEntities();
          await endpointContextRef.initSubscribers();

          await endpointContextRef.initDatabaseConnection();

          // console.log(
          //   'connection subscribers',
          //   endpointContextRef?.connection?.subscribers,
          // );
          // debugger;
          endpointContextRef.initMetadata();
          endpointContextRef.startServer();
          //#region @websql
          endpointContextRef.writeActiveRoutes();
          //#endregion

          await endpointContextRef.initClasses();
          let keepWebsqlDbDataAfterReload = false;
          //#region @browser
          keepWebsqlDbDataAfterReload =
            TaonAdmin.Instance.keepWebsqlDbDataAfterReload;
          //#endregion
          if (!Helpers.isNode && keepWebsqlDbDataAfterReload) {
            Helpers.info(`[taon] Keep websql data after reload`);
          } else {
            await endpointContextRef.reinitControllers();
          }
          ///#region TODO this may be usefull but for now
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

          resolve(endpointContextRef);
        });
      });
    },
    //#endregion
    /**
     * realtime communication with server
     * Udp socket.io (or ipc) based.
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
