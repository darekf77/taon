//#region @backend
import * as express from "express";
import * as http from "http";
//#endregion

import * as _ from 'lodash';
import { Connection } from 'typeorm';
import { Global } from './global-config';
import { initMidleware } from "./init-method";

export { Connection } from "typeorm";
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
  productionMode?: Boolean,
  //#region @backend
  connection?: Connection,
  testMode?: boolean,
  //#endregion
}) {
  const {
    ngZone,
    controllers = [],
    entities = [],
    productionMode = false,
    allowedHosts = [],
    //#region @backend
    testMode = false,
    connection
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
  Global.vars.ngZone = ngZone;

  Global.vars.entities = config.entities;
  Global.vars.controllers = config.controllers;

  Global.vars.__core_controllers.forEach(bctrl => controllers.push(bctrl));
  config.controllers = _.sortedUniq(controllers);
  Global.vars.productionMode = !!config.productionMode;

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
    if (!Global.vars.app) {
      Global.vars.app = express()
      initMidleware();
    }

    const uri = new URL(config.host);

    // console.log('backend URI', uri);
    Global.vars.url = uri;


    // if (uri.pathname !== '/') {
    //   console.log('INT EXPRESS BASE')
    //   Global.vars.app.set('base', uri.pathname)
    // }
    const h = new http.Server(Global.vars.app); //TODO is this working ?

    RealtimeNodejs.init(h);

    if (!testMode) {
      h.listen(uri.port, function () {
        console.log(`Server listening on port: ${uri.port}, hostname: ${uri.pathname},
          env: ${Global.vars.app.settings.env}
          `);
      });
    }

  }
  //#endregion

  if (Helpers.isBrowser) {
    const uri = new URL(config.host);
    Global.vars.url = uri;

    if (Array.isArray(allowedHosts)) {
      Global.vars.allowedHosts = allowedHosts.map(h => new URL(h))
    }

    RealtimeBrowser.init()


  }


  //#region @backend
  if (Helpers.isNode) {
    Global.vars.connection = connection;

    Global.vars.initFunc.filter(e => {
      const currentCtrl = controllers.find(ctrl => ctrl === e.target);
      if (currentCtrl) {
        e.initFN();

        (function (controller: Function) {
          const configs = Helpers.Class.getConfig(currentCtrl);
          const c: Models.Rest.ClassConfig = configs[0];
          for (let p in c.singleton) {
            if (c.singleton.hasOwnProperty(p)) {
              controller.prototype[p] = c.singleton[p];
            }
          }
          c.injections.forEach(inj => {
            Object.defineProperty(controller.prototype, inj.propertyName, { get: inj.getter as any });
          });
          if (!(c.singleton instanceof controller)) {
            const singleton = new (controller as any)();
            const oldSingleton = c.singleton;
            c.singleton = singleton;
            Object.keys(oldSingleton).forEach(key => {
              c.singleton[key] = oldSingleton[key];
            })
          }
          CLASS.setSingletonObj(controller, c.singleton);
        })(currentCtrl);

      }
    });

    Global.vars.writeActiveRoutes()
  }
  //#endregion

  if (Helpers.isBrowser) {
    const notFound: Function[] = [];
    const providers = controllers.filter(ctrl => {

      const e = Global.vars.initFunc.find(e => ctrl === e.target);
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
      throw `Decorator "@ENDPOINT(..)" is missing on class ${Helpers.Class.getName(ctrl)}`;
    });
    providers.forEach(p => Providers.push(p))
  }
}

export const Providers = [];
