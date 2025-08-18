import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { DecoratorAbstractOpt } from '../decorator-abstract-opt';

/**
 * Subscriber decorator
 */
export function TaonSubscriber(options: TaonSubscriberOptions) {
  return function (constructor: Function) {
    Reflect.defineMetadata(
      Symbols.metadata.options.subscriber,
      options,
      constructor,
    );
    Reflect.defineMetadata(
      Symbols.metadata.className,
      options?.className || constructor.name,
      constructor,
    );
    ClassHelpers.setName(constructor, options?.className);
  } as any;
}

export class TaonSubscriberOptions<T = any> extends DecoratorAbstractOpt {
  allowedEvents?: (keyof T)[];
}
