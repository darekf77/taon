//#region @backend
import * as express from 'express';
import * as http from 'http';
//#endregion

import {
  initMethodBrowser,
  //#region @backend
  initMethodNodejs
  //#endregion
} from '../init-method';
export { CLASS } from 'typescript-class-helpers';
import { Connection } from 'typeorm';
import * as _ from 'lodash';

import { Global } from '../global-config';
import { SYMBOL } from '../symbols';

import { Helpers } from '../helpers';
import { activateBaseCrud } from '../crud/activate-base-crud';
import { Models } from '../models';
export { Connection } from 'typeorm';


export function __ENDPOINT(baseEntity?: Function): (...args: any[]) => any {
  if (baseEntity) Global.vars.__core_controllers.push(baseEntity);
  return ENDPOINT();
}



export function ENDPOINT(options?: {
  // realtime?: boolean,
  path?: string,
  entity?: Function,
  additionalEntities?: Function[],
  auth?
  //#region @backend
  : Models.AuthCallBack
  //#endregion
}) {
  return function (target: Function) {

    let { path, auth, realtime = false, entity, additionalEntities } = options ? options : {} as any;

    target.prototype[SYMBOL.IS_ENPOINT_REALTIME] = realtime;

    const initFN = (function (target, path, auth) {
      return function () {
        // debugger
        // console.log(`INITING ${target.name} , parent ${target['__proto__'].name} `)
        activateBaseCrud(target, entity, additionalEntities)
        //#region  access decorator config
        const configs = Helpers.Class.getConfig(target);
        // console.log(`Class config for ${Helpers.Class.getName(target)}`, configs)
        const classConfig: Models.Rest.ClassConfig = configs[0];
        classConfig.path = path;
        const parentscalculatedPath = _
          .slice(configs, 1)
          .reverse()
          .map(bc => {
            if (Helpers.isGoodPath(bc.path)) {
              return bc.path
            }
            return Helpers.Class.getName(bc.classReference);
          }).join('/')

        if (Helpers.isGoodPath(path)) {
          classConfig.calculatedPath = path;
        } else {
          classConfig.calculatedPath = `/${parentscalculatedPath}/${Helpers.Class.getName(target)}`
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
          const methodConfig: Models.Rest.MethodConfig = classConfig.methods[methodName];
          const type: Models.Rest.HttpMethod = methodConfig.type;
          const expressPath = Helpers.getExpressPath(classConfig, methodConfig);
          // console.log('initfn expressPath', expressPath)
          if (Helpers.isNode) {
            //#region @backend
            if (checkAuthFn) {
              methodConfig.requestHandler = auth(methodConfig.descriptor.value);
            }
            const { routePath, method } = initMethodNodejs(type, methodConfig, classConfig, expressPath);
            Global.vars.activeRoutes.push({
              routePath,
              method
            });
            //#endregion
          }
          if (Helpers.isBrowser) {
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