//#region @browser
import { inject as angularInject } from '@angular/core';
//#endregion
import { Symbols } from './symbols';
import type { EndpointContext } from './endpoint-context';
import type { BaseInjector } from './base-classes/base-injector';
import { Observable, Subject } from 'rxjs';

/**
 * @deprecated
 * use Firedev.injectController(..) instead
 */
export const inject = <T>(entity: () => new (...args: any[]) => T): T => {
  return new Proxy(
    {},
    {
      get: (_, propName) => {
        if (propName === 'hasOwnProperty') {
          return () => false;
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
        // debugger
        return angularInject(ctor)[propName];
        //#endregion
      },
    },
  ) as T;
};

export type SubscbtionEvent<T> = {
  name: keyof T;
  data: any;
};

export const injectSubscriber = <T>(
  subscriberClassResolveFn: () => new (...args: any[]) => T,
  eventName: Omit<keyof T, 'clone'>,
): Observable<SubscbtionEvent<T>> => {
  const eventsSrc = new Subject<SubscbtionEvent<T>>();
  const obs = eventsSrc.asObservable();

  let isFirstSubscription = true;

  const proxiedObservable = new Proxy(obs, {
    get(target, prop, receiver) {
      if (prop === 'subscribe') {
        return (...args: any[]) => {
          if (isFirstSubscription) {
            isFirstSubscription = false;
            // console.log('First subscription, you can access arguments here:', {
            //   subscriberClassResolveFn,
            //   eventName,
            // });
            // @LAST
            const subscriberClassFN = subscriberClassResolveFn();
            const entity = subscriberClassFN.prototype.listenTo();

          }
          return target.subscribe(...args);
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  return proxiedObservable as Observable<SubscbtionEvent<T>>;
};
