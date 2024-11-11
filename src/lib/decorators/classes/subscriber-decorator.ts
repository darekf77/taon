import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
import { _ } from 'tnp-core/src';
export function TaonSubscriber(options: TaonSubscriberOptions) {
  return function (constructor: Function) {
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
  } as any;
}

export class TaonSubscriberOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {
  allowedEvents?: (keyof T)[];
}

