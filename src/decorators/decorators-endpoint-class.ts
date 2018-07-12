import {
  getExpressPath,
  ContextENDPOINT,
  //#region @backend
  AuthCallBack
  //#endregion
} from "../models";
import {
  getClassConfig,
  ClassConfig,
  MethodConfig,
  getClassName,
  HttpMethod
} from "ng2-rest";
import { initMethodBrowser } from "../init-method-browser";
import { initMethodNodejs, initMidleware } from "../init-method-node";
export { CLASSNAME } from 'ng2-rest';
import { Connection } from "typeorm";
import * as _ from "lodash";
import "reflect-metadata";
import { Global } from '../global-config';
import { isNode, isBrowser } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { Realtime } from '../realtime';
import { getSingletons } from '../helpers';

//#region @backend
import * as express from "express";
import * as http from "http";
//#endregion


export { Connection } from "typeorm";
export function OrmConnection(target: Object, propertyName: string) {
  //#region @backend
  const configs = getClassConfig(target.constructor);
  const c: ClassConfig = configs[0];
  c.injections.push({
    propertyName,
    getter: function () {
      return Global.vars.connection;
    }
  });
  //#endregion
}


export function BaseCRUDEntity(entity: Function) {
  return function BaseCRUDEntity(target: Object, propertyName: string) {

    getSingletons(target.constructor).forEach(s => {
      s[propertyName] = entity;
    });

  }
}

export function __ENDPOINT(baseEntity?: Function): (...args: any[]) => any {
  if (baseEntity) Global.vars.__core_controllers.push(baseEntity);
  return ENDPOINT();
}


function isGoodPath(p: string) {
  return p && typeof p === 'string' && p.trim() !== ''
}

export function ENDPOINT(options?: {
  path?: string,
  auth?
  //#region @backend
  : AuthCallBack
  //#endregion
}) {
  return function (target: Function) {

    const { path, auth } = options ? options : {} as any;

    const initFN = (function (target, path, auth) {
      return function () {
        // console.log(`INITING ${target.name}`)
        //#region  access decorator config
        const configs = getClassConfig(target);
        const classConfig: ClassConfig = configs[0];
        classConfig.path = path;
        const parentscalculatedPath = _
          .slice(configs, 1)
          .reverse()
          .map(bc => {
            if (isGoodPath(bc.path)) {
              return bc.path
            }
            return getClassName(bc.classReference);
          }).join('/')

        if (isGoodPath(path)) {
          classConfig.calculatedPath = path;
        } else {
          classConfig.calculatedPath = `/${parentscalculatedPath}/${getClassName(target)}`
            .replace(/\/\//g, '/');
        }

        // console.log(`${classConfig.calculatedPath}, target ${target.name}`)
        const checkAuthFn = (auth && typeof auth === 'function');

        _.slice(configs, 1).forEach(bc => {
          _.merge(classConfig.methods, _.cloneDeep(bc.methods))
        })

        //#endregion
        Object.keys(classConfig.methods).forEach(methodName => {
          const methodConfig: MethodConfig = classConfig.methods[methodName];
          const type: HttpMethod = methodConfig.type;
          const expressPath = getExpressPath(classConfig, methodConfig);
          // console.log('initfn expressPath', expressPath)
          if (isNode) {
            //#region @backend
            if (checkAuthFn) {
              methodConfig.requestHandler = auth(methodConfig.descriptor.value);
            }
            initMethodNodejs(type, methodConfig, classConfig, expressPath);
            //#endregion
          }
          if (isBrowser) {
            initMethodBrowser(target, type, methodConfig, expressPath)
          }
        });
      }
    })(target, path, auth);
    target.prototype[SYMBOL.CLASS_DECORATOR_CONTEXT] = { initFN, target };
    Global.vars.initFunc.push({ initFN, target });
  } as any;
}

// TODO allowed hosts in progress
export function init(config: {
  host: string,
  allowedHosts?: string[],
  controllers?: Function[], entities?: Function[]
  productionMode?: Boolean;
}) {
  const {
    controllers = [],
    entities = [],
    productionMode = false,
    allowedHosts = []
  } = config;

  Global.vars.entities = config.entities;
  Global.vars.controllers = config.controllers;

  Global.vars.__core_controllers.forEach(bctrl => controllers.push(bctrl));
  config.controllers = _.sortedUniq(controllers);
  Global.vars.productionMode = !!config.productionMode;


  //#region @backend
  if (isNode) {
    if (!Global.vars.app) {
      Global.vars.app = express()
      initMidleware();
    }
    const { URL } = require('url');
    const uri = new URL(config.host);
    Global.vars.url = uri;
    const h = new http.Server(Global.vars.app); //TODO is this working ?

    h.listen(uri.port, function () {
      console.log('Server listening on port %d in %s mode', uri.port,
        Global.vars.app.settings.env);
    });
  }
  //#endregion
  if (isBrowser) {
    const uri = new URL(config.host);
    Global.vars.url = uri;
    if (Array.isArray(allowedHosts)) {
      Global.vars.allowedHosts = allowedHosts.map(h => new URL(h))
    }
    Realtime.browser.init()
  }

  return {
    expressApp: (connection: Connection) => {
      //#region @backendFunc

      Global.vars.connection = connection;

      Global.vars.initFunc.filter(e => {
        const currentCtrl = controllers.find(ctrl => ctrl === e.target);
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
              const oldSingleton = c.singleton;
              c.singleton = singleton;
              Object.keys(oldSingleton).forEach(key => {
                c.singleton[key] = oldSingleton[key];
              })
            }
          })(currentCtrl);

        }
      });
      return Global.vars.app;
      //#endregion
    },
    angularProviders: () => {

      const notFound: Function[] = [];
      const providers = controllers.filter(ctrl => {

        const e = Global.vars.initFunc.find(e => ctrl === e.target);
        if (e) {
          // console.log('current controller ', currentCtrl)
          e.initFN();
          return true;
        } else {
          const context: ContextENDPOINT = ctrl.prototype[SYMBOL.CLASS_DECORATOR_CONTEXT];
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
        throw `Decorator "@ENDPOINT(..)" is missing on class ${getClassName(ctrl)}`;
      });
      providers.forEach(p => AngularProviders.push(p))
      return providers;
    }
  }
}

export const AngularProviders = [];
