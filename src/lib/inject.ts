import type { BaseInjector } from './base-classes/base-injector';
import type { EndpointContext } from './endpoint-context';
import { Symbols } from './symbols';

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
      },
    },
  ) as T;
};

// export const injectController = inject;

// export type SubscriptionEvent<T> = {
//   name: keyof T;
//   data: any;
// };

/**
 * TODO
 */
// export const injectEntityEvents = <T>(
//   subscriberClassResolveFn: () => new (...args: any[]) => T,
//   eventName?: keyof Omit<EntitySubscriberInterface,'listenTo'> ,
// ): Observable<SubscriptionEvent<T>> => {
//   const eventsSrc = new Subject<SubscriptionEvent<T>>();
//   const obs = eventsSrc.asObservable();

//   let isFirstSubscription = true;

//   const proxyObservable = new Proxy(obs, {
//     get(target, prop, receiver) {
//       if (prop === 'subscribe') {
//         return (...args: any[]) => {
//           if (isFirstSubscription) {
//             isFirstSubscription = false;
//             const subscriberClassFN: typeof BaseClass =
//               subscriberClassResolveFn() as any;
//             const ctx = subscriberClassFN[
//               Symbols.ctxInClassOrClassObj
//             ] as EndpointContext;
//             if (!ctx) {
//               throw new Error(
//                 `You are trying to inject class without context. Use context like this:

//               class MyClassSubscriber extends BaseSubscriber {
//                   ${eventName as any}() {
//                     \/\/ your code here
//                   }
//               }

//               Taon.injectSubscriberEvents( MyContext.getInstance(()=> MyClassSubscriber), '${eventName as any}' )

//               `,
//               );
//             }
//             const subscriberInstance = ctx.getInstanceBy(subscriberClassFN);
//             // subscriberInstance TODO @LAST subscriber event from instance
//             // const entity = subscriberClassFN.prototype.listenTo();
//             console.log('First subscription, you can access arguments here:', {
//               subscriberClassFN,
//               eventName,
//             });
//           }
//           return target.subscribe(...args);
//         };
//       }
//       return Reflect.get(target, prop, receiver);
//     },
//   });

//   return proxyObservable as Observable<SubscriptionEvent<T>>;
// };
