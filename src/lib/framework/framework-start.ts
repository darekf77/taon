import { _ } from 'tnp-core/src';
import { IConnectionOptions, StartOptions } from './framework-models';
import { FrameworkContext } from './framework-context';
import { Helpers } from 'tnp-helpers/src';
import axios from 'axios';
import { Subject } from 'rxjs';
import { CLASS } from 'typescript-class-helpers/src';
//#region notForNpm
// import type { FiredevAdmin } from 'firedev-ui'; // circural dependency DO NOT UNCOMMENT
//#endregion

export function start(options: Omit<StartOptions,
  'InitDataPrioritypublicAssets' |
  'publicAssets' |
  'allowedHosts'
>) {

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

  let admin
  // : FiredevAdmin; // DO NOT UNCOMMNET

  //#region @browser
  if (Helpers.isBrowser) {
    admin = window['firedev'];
  }
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
      config['useLocalForage'] = !!window['localforage']

      // @ts-ignore
      config.location = (config.database || '').replace('.sqlite', '');

      delete config.database;
    }
    // @ts-ignore
    // console.log('INITING LOCATION WEBSQL DB ' + config?.location)
    //#endregion

    // config['useLocalForage'] = false; // TODO REMOVE
    // console.log('USING LOCAL FORAGE', config['useLocalForage'])

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

    if (config) {

      const c = config as any as IConnectionOptions;
      if (!admin || !admin.keepWebsqlDbDataAfterReload
        // || admin.firstTimeKeepWebsqlDbDataTrue
      ) {
        // console.log('DROP SCHEMA')
        c.dropSchema = true;
        c.synchronize = true;
      } else {
        // console.log('KEEP SCHEMA')
        c.dropSchema = false;
        delete c.synchronize // false is not auto synchonize - from what I understand
      }
    }
    //#endregion
    controllers = Array.isArray(controllers) ? controllers : [];
    entities = Array.isArray(entities) ? entities : [];

    //#region @backend
    if (!Helpers.isRunningIn.cliMode()) {
      //#endregion
      let FiredevFileController = CLASS.getBy('FiredevFileController');
      let FiredevBinaryFileController = CLASS.getBy('FiredevBinaryFileController');
      let FiredevBinaryFile = CLASS.getBy('FiredevBinaryFile');
      let FiredevFile = CLASS.getBy('FiredevFile');
      let FiredevFileCss = CLASS.getBy('FiredevFileCss');

      // const { FiredevFileController, FiredevFile, FiredevFileCss } = await import('firedev-ui');
      //#region @backend
      FiredevFileController = require('firedev-ui/src').FiredevFileController;
      FiredevBinaryFileController = require('firedev-ui/src').FiredevBinaryFileController;
      FiredevBinaryFile = require('firedev-ui/src').FiredevBinaryFile;
      FiredevFile = require('firedev-ui/src').FiredevFile;
      FiredevFileCss = require('firedev-ui/src').FiredevFileCss;
      // console.log({ FiredevFileController, FiredevFile, FiredevFileCss })
      //#endregion
      controllers.push(FiredevFileController as any);
      controllers.push(FiredevBinaryFileController as any);
      entities.push(FiredevBinaryFile as any);
      entities.push(FiredevFile);
      entities.push(FiredevFileCss);
      //#region @backend
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

    // console.log('browser init start')
    context.initBrowser();
    // console.log('browser init done')

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

    //#region @browser
    let obs: Subject<boolean>;
    if (!window['firedev']['contextLoaded']) {
      obs = new Subject<boolean>();
      window['firedev']['contextLoaded'] = obs;
    } else {
      obs = window['firedev']['contextLoaded'];
    }
    obs['anyContextLoaded'] = true;
    obs.next(true);
    //#endregion

    resolve(context);
  })


}
