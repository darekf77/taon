//#region @browser
import { inject as angularInject } from '@angular/core';
//#endregion
import { Symbols } from './symbols';

export const inject = <T>(entity: () => new (...args: any[]) => T): T => {
  return new Proxy(
    {},
    {
      get: (_, propName) => {
        const ctor = entity();
        const contextFromClass = ctor[Symbols.ctxInClassOrClassObj];
        const resultContext = contextFromClass;
        if (resultContext) {
          let instance: T = resultContext.inject(ctor);
          return typeof instance[propName] === 'function'
            ? instance[propName].bind(instance)
            : instance[propName];
        }
        //#region @browser
        return angularInject(ctor)[propName];
        //#endregion
      },
    },
  ) as T;
};
