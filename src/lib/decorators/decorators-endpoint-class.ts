import {
  initMethodBrowser,
  //#region @backend
  initMethodNodejs
  //#endregion
} from '../init-method';
export { CLASS } from 'typescript-class-helpers';
import { CLASS } from 'typescript-class-helpers';
import { _, Helpers } from 'tnp-core';
import { SYMBOL } from '../symbols';
import { MorphiHelpers } from '../helpers';
import { activateBaseCrud } from '../crud/activate-base-crud';
import { Models } from '../models';
import { FrameworkContext } from '../framework/framework-context';
export { Connection } from 'typeorm';

export function __ENDPOINT(baseEntity?: Function): (...args: any[]) => any {
  return ENDPOINT();
}

export function ENDPOINT(options?: {
  path?: string,
  entity?: Function,
  additionalEntities?: Function[],
  auth?
  //#region @backend
  : Models.AuthCallBack
  //#endregion
}) {
  return function (target: Function) {

    let { path, auth, entity, additionalEntities } = options ? options : {} as any;

    const initFN = (function (target, targetPath, auth) {
      return function () {
        const context = FrameworkContext.findForTraget(target);

        activateBaseCrud(target, entity, additionalEntities, context)

        const configs = CLASS.getConfig(target) as any[];
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


        Object.keys(classConfig.methods).forEach(methodName => {
          const methodConfig: Models.Rest.MethodConfig = classConfig.methods[methodName];
          const type: Models.Rest.HttpMethod = methodConfig.type;
          const expressPath = MorphiHelpers.getExpressPath(classConfig, methodConfig);
          // console.log('initfn expressPath', expressPath)
          if (Helpers.isNode) {
            //#region @backend
            if (checkAuthFn) {
              methodConfig.requestHandler = auth(methodConfig.descriptor.value);
            }

            const { routePath, method } = initMethodNodejs(type, methodConfig, classConfig, expressPath, target);
            if (!context.onlyForBackendRemoteServerAccess) {
              context.node.activeRoutes.push({
                routePath,
                method
              });
            }

            //#endregion
          }
          if (Helpers.isBrowser
            //#region @backend
            || context.onlyForBackendRemoteServerAccess
            //#endregion
          ) {
            initMethodBrowser(target, type, methodConfig, expressPath)
          }
        });
      }
    })(target, path, auth);
    target.prototype[SYMBOL.CLASS_DECORATOR_CONTEXT] = { initFN, target };
    FrameworkContext.initFunc.push({ initFN, target });
  } as any;
}
