import {
  initMethodBrowser,
} from '../init-method';
//#region @websql
import {
  initMethodNodejs
} from '../init-method';
//#endregion
export { CLASS } from 'typescript-class-helpers';
import { CLASS } from 'typescript-class-helpers';
import { _, Helpers } from 'tnp-core';
import { SYMBOL } from '../symbols';
import { MorphiHelpers } from '../helpers';
import { activateBaseCrud } from '../crud/activate-base-crud';
import { Models } from '../models';
import { FrameworkContext } from '../framework/framework-context';
export { Connection } from 'firedev-typeorm';

export function __ENDPOINT(baseEntity?: Function): (...args: any[]) => any {
  return ENDPOINT();
}

export function ENDPOINT(options?: {
  path?: string,
  entity?: Function,
  additionalEntities?: Function[],
  auth?
  //#region @websql
  : Models.AuthCallBack
  //#endregion
}) {
  return function (target: Function) {

    let { path, auth, entity } = options ? options : {} as any;

    const initFN = (function (target, targetPath, auth) {
      return function () {
        const context = FrameworkContext.findForTraget(target);

        activateBaseCrud(target, entity, context)

        const configs = CLASS.getConfigs(target) as any[];
        // console.log(`Class config for ${CLASS.getName(target)}`, configs)
        const classConfig: Models.Rest.ClassConfig = configs[0];
        classConfig.path = targetPath;
        const parentscalculatedPath = _
          .slice(configs, 1)
          .reverse()
          .map(bc => {
            if (MorphiHelpers.isGoodPath(bc.path)) {
              return bc.path
            }
            return CLASS.getName(bc.classReference);
          }).join('/')

        if (MorphiHelpers.isGoodPath(targetPath)) {
          classConfig.calculatedPath = targetPath;
        } else {
          classConfig.calculatedPath = `/${parentscalculatedPath}/${CLASS.getName(target)}`
            .replace(/\/\//g, '/');
        }


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

        //#region @backend
        if (!Helpers.isRunningIn.cliMode()) {
          //#endregion
          console.groupCollapsed(`express routes [${classConfig.className}]`);
          //#region @backend
        }
        //#endregion


        Object.keys(classConfig.methods).forEach(methodName => {
          const methodConfig: Models.Rest.MethodConfig = classConfig.methods[methodName];
          const type: Models.Rest.HttpMethod = methodConfig.type;
          const expressPath = methodConfig.global
            ? `/${methodConfig.path?.replace(/\//, '')}`
            : MorphiHelpers.getExpressPath(classConfig, methodConfig);

          // console.log('initfn expressPath', expressPath)
          if (Helpers.isNode
            //#region @websqlOnly
            || Helpers.isWebSQL
            //#endregion
          ) {
            //#region @websql
            if (checkAuthFn) {
              methodConfig.requestHandler = auth(methodConfig.descriptor.value);
            }

            const { routePath, method } = initMethodNodejs(type, methodConfig, classConfig, expressPath, target);
            //#region @backend
            if (!context.onlyForBackendRemoteServerAccess) {
              context.node.activeRoutes.push({
                routePath,
                method
              });
            }
            //#endregion

            //#endregion
          }
          if (Helpers.isBrowser
            //#region @backend
            || context.onlyForBackendRemoteServerAccess
            //#endregion
            //#region @websqlOnly
            || Helpers.isWebSQL
            //#endregion
          ) {
            initMethodBrowser(target, type, methodConfig, expressPath)
          }
        });

        //#region @backend
        if (!Helpers.isRunningIn.cliMode()) {
          //#endregion
          console.groupEnd();
          //#region @backend
        }
        //#endregion


      }
    })(target, path, auth);
    target.prototype[SYMBOL.CLASS_DECORATOR_CONTEXT] = { initFN, target };
    FrameworkContext.initFunc.push({ initFN, target });
  } as any;
}
