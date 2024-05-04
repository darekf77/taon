import { Helpers } from "tnp-core/src";
import { EndpointContext } from "./endpoint-context";
import { Models } from "./models";
import { FiredevAdmin } from "./firedev-admin";

export const createContext = <
  CTX extends Record<string, object>,
  CTRL extends Record<string, new (...args: any[]) => any>,
  ENTITY extends Record<string, new (...args: any[]) => any>,
  REPO extends Record<string, new (...args: any[]) => any>,
  PROVIDER extends Record<string, new (...args: any[]) => any>
>(
  config: Models.ContextOptions<CTX, CTRL, ENTITY, REPO, PROVIDER>
) => {
  const ref = new EndpointContext(config);

  const res = {
    types: {
      entities: config.entities,
      controllers: config.controllers,
      repositories: config.repositories,
      providers: config.providers,
    },
    contexts: config.contexts,
    get ref() {
      return ref;
    },
    /**
     * - create controller instances for context
     * - init database (if enable) + migation scripts
     */
    initialize: async () => {
      if (config.abstract) {
        throw new Error(`Abstract context can not be initialized`);
      }
      await ref.initEntities();
      await ref.initDatabaseConnection();
      await ref.initSubscribers();
      ref.initMetadata();
      ref.startServer();
      //#region @websql
      ref.writeActiveRoutes();
      //#endregion

      await ref.initClasses();
      if (FiredevAdmin.Instance.keepWebsqlDbDataAfterReload && !Helpers.isNode) {
        Helpers.info(`[firedev] Keep websql data after reload`);
      } else {
        await ref.reinitControllers();
      }
    },
  };
  // console.log({ ref })
  if (config.abstract) {
    Helpers.info(`[firedev] Create abstract context: ${ref.contextName}`);
  } else {
    if (ref.remoteHost) {
      Helpers.info(`[firedev] Create context for remote host: ${ref.remoteHost}`);
    } else {
      Helpers.info(`[firedev] Create context for host: ${ref.host}`);
    }
  }

  return res;
}
//#endregion
