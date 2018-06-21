import {
  CLASS_META_CONFIG, Response, isNode, isBrowser,
  METHOD_DECORATOR, getExpressPath, GlobalVars,
  CLASS_DECORATOR_CONTEXT, ContextENDPOINT,
  //#region @backend
  AuthCallBack
  //#endregion
} from "./models";
import { getClassConfig, ClassConfig, MethodConfig, ParamConfig, ParamType, getClassName } from "ng2-rest";
import { initMethodBrowser, initRealtime } from "./init-method-browser";
import { initMethodNodejs, initMidleware } from "./init-method-node";
import { HttpMethod, } from 'ng2-rest';
import { Connection } from "typeorm";
import * as _ from "lodash";
import "reflect-metadata";
declare var require: any;


export const global: GlobalVars = {
  allowedHosts: undefined,
  productionMode: false,
  url: undefined,
  app: undefined,
  socket: undefined,
  endpoints: [],
  entities: [],
  connection: undefined as Connection,
  base_controllers: []
}
if (isNode) {
  //#region @backend
  var express = require('express');
  var io = require('socket.io');
  var http = require('http');
  //#endregion
}

if (isBrowser) {
  var { initEntities } = require("ng2-rest");
}


export { Connection } from "typeorm";
export function OrmConnection(target: Object, propertyName: string) {
  const configs = getClassConfig(target.constructor);
  const c: ClassConfig = configs[0];
  c.injections.push({
    propertyName,
    getter: function () {
      return global.connection;
    }
  });;
}

export function BaseCRUDEntity(entity: Function) {
  return function BaseCRUDEntity(target: Object, propertyName: string) {
    const configs = getClassConfig(target.constructor);
    const c: ClassConfig = configs[0];
    target.constructor['__proto__'].prototype[propertyName] = entity;
  }
}

export function __ENDPOINT(path?: string | BaseLevelPath, baseEntity?: Function): (...args: any[]) => any {
  if (baseEntity) global.base_controllers.push(baseEntity);
  return ENDPOINT({ path });
}

export type BaseLevelPath = (previousPath: string[]) => string;

/**
 * PLEASE PROVIDE NAME AS TYPED STRING, NOT VARIABLE
 * Decorator requred for production mode
 * @param name Name of class
 */
export function CLASSNAME(name: string) {
  return function (target: Function) {
    const configs = getClassConfig(target.constructor);
    const c = configs[0];
    c.className = name;
  } as any;
}


export function ENDPOINT(options?: {
  path?: string | BaseLevelPath,
  auth?
  //#region @backend
  : AuthCallBack
  //#endregion
}) {
  return function (target: Function) {
    const { path, auth } = options ? options : {} as any;
    const initFN = (function (target, path, auth) {
      return function () {

        //#region  access decorator config
        const configs = getClassConfig(target);
        const c: ClassConfig = configs[0];

        if (isBrowser && !c.className && global.productionMode) {
          throw `(PRODUCTION MODE ERROR)
Please use decoartor CLASSNAME for each entity/controller
This is preventing class mangle problem.

import { CLASSNAME } from 'morphi/browser';

@CLASSNAME('ExampleClass')
class ExampleClass {
  ...
}
`

        }

        if (path === undefined) {
          c.basePath = `/${getClassName(target)}`;
        } else if (typeof path === 'string') {
          c.basePath = path;
        } else if (typeof path === 'function') {
          c.basePath = (path as Function).call(this, _.slice(configs, 1).map(bc => bc.basePath));
        }
        const checkAuthFn = (auth && typeof auth === 'function');
        //#endregion
        Object.keys(c.methods).forEach(methodName => {
          const m: MethodConfig = c.methods[methodName];
          const type: HttpMethod = m.type;
          const expressPath = getExpressPath(c, m);
          if (isNode) {
            //#region @backend
            if (checkAuthFn) {
              m.requestHandler = auth(m.descriptor.value);
            }
            initMethodNodejs(global, type, m, c, expressPath);
            //#endregion
          }
          if (isBrowser) {
            initMethodBrowser(target, type, m, expressPath)
          }
        });
      }
    })(target, path, auth);
    target.prototype[CLASS_DECORATOR_CONTEXT] = { initFN, target };
    global.endpoints.push({ initFN, target });
  } as any;
}

// TODO allowed hosts in progress
export function init(host: string, allowedHosts?: string[], productionMode = false) {
  // debugger;
  if (isNode) {
    //#region @backend
    if (!global.app) {
      global.app = express()
      initMidleware(global);
    }
    const { URL } = require('url');
    const uri = new URL(host);
    global.url = uri;
    global.productionMode = productionMode;
    if (Array.isArray(allowedHosts)) {
      global.allowedHosts = allowedHosts.map(h => new URL(h))
    }
    http = http.Server(global.app);
    global.socket = io(http);
    global.socket.on('connection', (socket) => {
      console.log('user connected');
      socket.on('disconnect', function () {
        console.log('user disconnected');
      });
    });
    http.listen(uri.port, function () {
      console.log('Server listening on port %d in %s mode', uri.port, global.app.settings.env);
    });
    //#endregion
  }
  if (isBrowser) {
    const uri = new URL(host);
    global.url = uri;
    if (Array.isArray(allowedHosts)) {
      global.allowedHosts = allowedHosts.map(h => new URL(h))
    }
    window['uri'] = uri;
    initRealtime();
  }

  return {
    expressApp: (config: { controllers?: Function[], entities?: Function[], connection?: Connection }) => {
      let { controllers, entities, connection } = config;
      global.base_controllers.forEach(bctrl => controllers.push(bctrl));
      controllers = _.sortedUniq(controllers);
      global.connection = connection;
      global.entities = config.entities;
      global.endpoints.filter(e => {
        const currentCtrl = controllers.find(ctrl => ctrl.name === e.target.name);
        if (currentCtrl) {
          e.initFN();

          (function (controller: Function) {
            const configs = getClassConfig(currentCtrl);
            const c: ClassConfig = configs[0];
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
              c.singleton = singleton;
            }
          })(currentCtrl);

        }
      });
      return global.app;
    },
    angularProviders: (config: { controllers?: Function[], entities?: Function[], connection?: Connection }) => {
      let { controllers, entities, connection } = config;
      global.base_controllers.forEach(bctrl => controllers.push(bctrl));
      controllers = _.sortedUniq(controllers);
      initEntities(entities);
      const notFound: Function[] = [];
      const providers = controllers.filter(ctrl => {
        const e = global.endpoints.find(e => ctrl.name === e.target.name);
        if (e) {
          // console.log('current controller ', currentCtrl)
          e.initFN();
          return true;
        } else {
          const context: ContextENDPOINT = ctrl.prototype[CLASS_DECORATOR_CONTEXT];
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
        console.error(`Decorator "@ENDPOINT(..)" is missing on class ${getClassName(ctrl)}`);
      });
      providers.forEach(p => AngularProviders.push(p))
      return providers;
    }
  }
}

export const AngularProviders = [];
