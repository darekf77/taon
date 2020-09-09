//#region @backend
import * as express from 'express';
import * as http from 'http';
//#endregion

import * as _ from 'lodash';
import { Connection } from 'typeorm';
import { GlobalConfig } from './global-config';
import { initMidleware } from './init-method';

export { Connection } from 'typeorm';
import { RealtimeNodejs, RealtimeBrowser } from './realtime';
import { Models } from './models';
import { SYMBOL } from './symbols';
import { Helpers } from './helpers';
import { CLASS } from 'typescript-class-helpers';

export function init(config: {
  host: string,
  ngZone?: any,
  allowedHosts?: string[],
  controllers?: Function[],
  entities?: Function[]
  productionMode?: boolean,
  workerMode?: boolean,
  //#region @backend
  onlyForBackendRemoteServerAccess?: boolean,
  connection?: Connection,
  testMode?: boolean,
  //#endregion
}) {
  const {
    host,
    ngZone,
    controllers = [],
    entities = [],
    productionMode = false,
    workerMode = false,
    allowedHosts = [],
    //#region @backend
    testMode = false,
    connection,
    onlyForBackendRemoteServerAccess = false
    //#endregion
  } = config;

  if (_.isArray(controllers) && controllers.filter(f => !_.isFunction(f)).length > 0) {
    console.error('controllers', controllers)
    throw `

Incorect value for property "controllers" inside Morphi.Init(...)

`
  }

  if (_.isArray(entities) && entities.filter(f => !_.isFunction(f)).length > 0) {
    console.error('entites', entities)
    throw `

Incorect value for property "entities" inside Morphi.Init(...)

`
  }

  //#region @backend
  if (Helpers.isNode) {
    var { URL } = require('url');
  }
  //#endregion

  if (Helpers.isBrowser && _.isUndefined(ngZone) && !!window['ng']) {
    console.warn(`Please probide ngZone instance in angular apps`)
  }
  GlobalConfig.vars.ngZone = ngZone;

  GlobalConfig.vars.entities = config.entities;
  GlobalConfig.vars.controllers = config.controllers;

  GlobalConfig.vars.__core_controllers.forEach(bctrl => controllers.push(bctrl));
  config.controllers = _.sortedUniq(controllers);
  GlobalConfig.vars.productionMode = !!config.productionMode;

  // backend URI URL {
  //   href: 'http://localhost:4000/api',
  //   origin: 'http://localhost:4000',
  //   protocol: 'http:',
  //   username: '',
  //   password: '',
  //   host: 'localhost:4000',
  //   hostname: 'localhost',
  //   port: '4000',
  //   pathname: '/api',
  //   search: '',
  //   searchParams: URLSearchParams {},
  //   hash: '' }

  //#region @backend
  if (Helpers.isNode) {
    if (GlobalConfig.vars.onlyForBackendRemoteServerAccess) {
      GlobalConfig.vars.app = {} as any;
    } else {
      if (!GlobalConfig.vars.app) {
        GlobalConfig.vars.app = express()
        initMidleware();
      }
    }

    const uri = new URL(config.host);

    // console.log('backend URI', uri);
    GlobalConfig.vars.url = uri;


    // if (uri.pathname !== '/') {
    //   console.log('INT EXPRESS BASE')
    //   Global.vars.app.set('base', uri.pathname)
    // }
    if (!GlobalConfig.vars.onlyForBackendRemoteServerAccess) {
      const h = new http.Server(GlobalConfig.vars.app); //TODO is this working ?

      if (!GlobalConfig.vars.disabledRealtime) {
        RealtimeNodejs.init(h, host);
      }


      if (!testMode) {
        h.listen(uri.port, function () {
          console.log(`Server listening on port: ${uri.port}, hostname: ${uri.pathname},
            env: ${GlobalConfig.vars.app.settings.env}
            `);
        });
      }
    }
  }
  //#endregion

  if (Helpers.isBrowser
    //#region @backend
    || GlobalConfig.vars.onlyForBackendRemoteServerAccess
    //#endregion
  ) {
    const uri = new URL(config.host);
    GlobalConfig.vars.url = uri;

    if (Array.isArray(allowedHosts)) {
      GlobalConfig.vars.allowedHosts = allowedHosts.map(h => new URL(h))
    }
    if (!GlobalConfig.vars.disabledRealtime) {
      RealtimeBrowser.init(host);
    }


  }


  //#region @backend
  if (Helpers.isNode) {
    GlobalConfig.vars.connection = connection;

    GlobalConfig.vars.initFunc.filter(e => {
      const currentCtrl = controllers.find(ctrl => ctrl === e.target);
      if (currentCtrl) {
        e.initFN();

        (function (controller: Function) {
          const c = CLASS.getConfig(currentCtrl)[0];

          c.injections.forEach(inj => {
            Object.defineProperty(controller.prototype, inj.propertyName, { get: inj.getter as any });
          });
          CLASS.setSingletonObj(controller, new (controller as any)());

          // Helpers.isBrowser && console.log(`[morphi] Singleton cleated for "${controller && controller.name}"`, CLASS.getSingleton(controller))
        })(currentCtrl);

      }
    });
    if (!onlyForBackendRemoteServerAccess) {
      GlobalConfig.vars.writeActiveRoutes(workerMode)
    }
  }
  //#endregion

  if (Helpers.isBrowser) {
    const notFound: Function[] = [];
    const providers = controllers.filter(ctrl => {

      const e = GlobalConfig.vars.initFunc.find(e => ctrl === e.target);
      if (e) {
        // console.log('current controller ', currentCtrl)
        e.initFN();
        return true;
      } else {
        const context: Models.ContextENDPOINT = ctrl.prototype[SYMBOL.CLASS_DECORATOR_CONTEXT];
        if (!context) {
          notFound.push(ctrl);
          return false;
        } else {
          context.initFN();
          return true;
        }
      }
    })
    notFound.forEach(ctrl => {
      throw `Decorator "@ENDPOINT(..)" is missing on class ${CLASS.getName(ctrl)}`;
    });
    providers.forEach(p => Providers.push(p))
  }
}

export const Providers = [];
