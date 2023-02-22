import { _ } from 'tnp-core';
import { IConnectionOptions, StartOptions } from './framework-models';
import { FrameworkContext } from './framework-context';
import { Helpers } from 'tnp-core';
import axios from 'axios';

export function start(options: StartOptions) {

  //#region autodetecting ngzone in progress in progress

  // try {
  //   // @ts-ignore
  //   let ngZone = window.ng.probe(windowgetAllAngularRootElements()[0]) // @ts-ignore
  //     .injector.get(window.ng.coreTokens.NgZone);
  //   console.log(`ngzone to set `, ngZone)
  //   // FrameworkContext.initNGZone();
  // } catch (error) {
  //   console.warn(`error while getting ngzone `, error)
  // }

  // try {
  //   // @ts-ignore
  //   let ngZone = window.ng.getComponent(windowgetAllAngularRootElements()[0]) // @ts-ignore
  //     .__ngContext__.debug.injector.get(window.ng.coreTokens.NgZone);
  //   console.log(`ngzone to set `, ngZone)
  //   // FrameworkContext.initNGZone();
  // } catch (error) {
  //   console.warn(`error while getting ngzone `, error)
  // }
  //#endregion

  return new Promise<FrameworkContext>(async (resolve, reject) => {

    let {
      host,
      controllers = [],
      entities = [],
      disabledRealtime,
      allowedHosts,
      session,
      //#region @websql
      mode,
      config,
      InitDataPriority,
      publicAssets = [],
      middlewares = [],
      //#endregion
    } = options as StartOptions;
    //#region @backend
    if (_.isUndefined(mode)) {
      mode = 'backend/frontend';
    }
    //#endregion

    //#region @websqlOnly
    mode = 'websql/backend-frontend';
    if (config) { // @ts-ignore
      config.type = 'sqljs';
      // @ts-ignore
      config.autoSave = true;

      // @ts-ignore
      config.location = (config.database || '').replace('.sqlite', '');

      delete config.database;
    }
    // @ts-ignore
    // console.log('INITING LOCATION WEBSQL DB ' + config?.location)
    //#endregion


    if (session) {
      const oneHour = 1000 * 60 * 60 * 1; // 24;
      if (!session.maxAge) {
        session.maxAge = oneHour;
      }
      if (Helpers.isBrowser) {
        axios.defaults.withCredentials = true;
      }
    }

    //#region @websql

    if(config) {
      const c = config as any as IConnectionOptions;
      c.dropSchema = true;
      c.synchronize = true;
    }
    //#endregion

    const context = new FrameworkContext({
      host,
      controllers,
      entities,
      allowedHosts,
      disabledRealtime,
      session,
      //#region @websql
      mode,
      InitDataPriority,
      publicAssets,
      config,
      middlewares,
      //#endregion
    });

    //#region @websql
    await context.initNode();
    //#endregion

    context.initBrowser();

    if (Helpers.isBrowser) {
      setTimeout(() => {
        // @ts-ignore
        let angularVer = _.first(getAllAngularRootElements()[0].attributes['ng-version']?.value?.split('.'));
        // console.log('Angular version: ' + angularVer)
        const verNum = Number(angularVer);

        if (!isNaN(verNum) && !FrameworkContext.isNgZoneInited) {
          Helpers.error(`
  [Firedev] Angular ${verNum} version detected...
  [Firedev] NgZone instance is not inited... please use:

  constructor(
    ...
    ngzone:NgZone
    ...
  ) {
    Firedev.initNgZone(ngzone);
  }

          `, true, true)
        }
      });

    }

    resolve(context);
  })


}
