import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
import { _ } from 'tnp-core/src';
import type { BaseSubscriber } from '../../base-classes/base-subscriber';

export class FiredevSubscriberOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {
  allowedEvents?: (keyof T)[];
}

export function FiredevSubscriber(options: FiredevSubscriberOptions) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    Reflect.defineMetadata(
      Symbols.metadata.options.repository,
      options,
      constructor,
    );
    Reflect.defineMetadata(
      Symbols.metadata.className,
      options?.className || constructor.name,
      constructor,
    );
    ClassHelpers.setName(constructor, options?.className);
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);

        // Get all method names of the class
        const methodNamesAll = ClassHelpers.getMethodsNames(
          constructor.prototype,
        );

        const methodNames = methodNamesAll.filter(m => {
          return (
            !['__trigger_event__', 'clone'].includes(m) &&
            !m.startsWith('_') &&
            !m.startsWith('inject')
          );
        });

        // Wrap each method
        methodNames.forEach(methodName => {
          const originalMethod = (this as any)[methodName];

          (this as any)[methodName] = async (...methodArgs: any[]) => {
            const result = originalMethod.apply(this, methodArgs);

            // If the result is a promise, wait for it to resolve
            if (result instanceof Promise) {
              await result;
            }

            // Check if we need to trigger the manual event
            if (
              options.allowedEvents === undefined ||
              options.allowedEvents.includes(methodName)
            ) {
              // @ts-ignore
              (this as BaseSubscriber).__trigger_event__(methodName as any);
            }

            return result;
          };
        });
      }
    } as any;
  } as any;
}
