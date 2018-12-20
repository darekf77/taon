import {
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
import { initMethodBrowser, initMethodNodejs, initMidleware } from "../init-method";
export { CLASSNAME } from 'ng2-rest';
import { Connection } from "typeorm";
import * as _ from "lodash";
import "reflect-metadata";
import { Global } from '../global-config';
import { isNode, isBrowser } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { Realtime } from '../realtime';
import { Helpers } from '../helpers';
import { activateBaseCrud } from '../crud/activate-base-crud';
//#region @backend
import * as express from "express";
import * as http from "http";
//#endregion


export { Connection } from "typeorm";


export function __ENDPOINT(baseEntity?: Function): (...args: any[]) => any {
  if (baseEntity) Global.vars.__core_controllers.push(baseEntity);
  return ENDPOINT();
}


export function ENDPOINT(options?: {
  // realtime?: boolean,
  path?: string,
  entity?: Function,
  auth?
  //#region @backend
  : AuthCallBack
  //#endregion
}) {
  return function (target: Function) {

    const { path, auth, realtime = false, entity } = options ? options : {} as any;

    target.prototype[SYMBOL.IS_ENPOINT_REALTIME] = realtime;

    const initFN = (function (target, path, auth) {
      return function () {
        // debugger
        // console.log(`INITING ${target.name} , parent ${target['__proto__'].name} `)
        activateBaseCrud(target, entity)
        //#region  access decorator config
        const configs = getClassConfig(target);
        const classConfig: ClassConfig = configs[0];
        classConfig.path = path;
        const parentscalculatedPath = _
          .slice(configs, 1)
          .reverse()
          .map(bc => {
            if (Helpers.isGoodPath(bc.path)) {
              return bc.path
            }
            return getClassName(bc.classReference);
          }).join('/')

        if (Helpers.isGoodPath(path)) {
          classConfig.calculatedPath = path;
        } else {
          classConfig.calculatedPath = `/${parentscalculatedPath}/${getClassName(target)}`
            .replace(/\/\//g, '/');
        }

        // console.log(`${classConfig.calculatedPath}, target ${target.name}`)
        const checkAuthFn = (auth && typeof auth === 'function');

        _.slice(configs, 1).forEach(bc => {
          const alreadyIs = classConfig.methods;
          const toMerge = _.cloneDeep(bc.methods)
          for (const key in toMerge) {
            if (toMerge.hasOwnProperty(key) && !alreadyIs[key]) {
              const element = toMerge[key];
              alreadyIs[key] = element;
            }
          }
        })

        //#endregion
        Object.keys(classConfig.methods).forEach(methodName => {
          const methodConfig: MethodConfig = classConfig.methods[methodName];
          const type: HttpMethod = methodConfig.type;
          const expressPath = Helpers.getExpressPath(classConfig, methodConfig);
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
