//#region @browser
import { inject as angularInject } from '@angular/core';
//#endregion
import { Symbols } from './symbols';
import type { EndpointContext } from './endpoint-context';
import type { BaseInjector } from './base-classes/base-injector';

export const inject = <T>(entity: () => new (...args: any[]) => T): T => {
  return new Proxy(
    {},
    {
      get: (_, propName) => {
        if(propName === 'hasOwnProperty') {
          return ()=> false;
        }

        const ctor = entity();
        const contextFromClass = ctor[
          Symbols.ctxInClassOrClassObj
        ] as EndpointContext;
        const resultContext = contextFromClass;
        if (resultContext) {
          let instance = resultContext.inject(ctor) as BaseInjector;
          // console.log('instance', instance);

          if (propName === 'getOriginalPrototype') {
            return () => Object.getPrototypeOf(instance);
          }
          if (propName === 'getOriginalConstructor') {
            return () => instance.constructor;
          }

          const methods = ctor[Symbols.classMethodsNames] || [];
          const isMethods = methods.includes(propName);

          const methodOrProperty = isMethods
            ? instance[propName].bind(instance)
            : instance[propName];

          // console.log(
          //   `methodOrProperty from proxy ${propName?.toString()} = isMethods:${isMethods}`,
          //   methods,
          // );
          return methodOrProperty;
        }
        //#region @browser
        debugger
        return angularInject(ctor)[propName];
        //#endregion
      },
    },
  ) as T;
};
