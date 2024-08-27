import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';

export function TaonProvider<T = any>(options?: FiredevProviderOptions<T>) {
  return function (constructor: Function) {
    Reflect.defineMetadata(
      Symbols.metadata.options.provider,
      options,
      constructor,
    );
    Reflect.defineMetadata(
      Symbols.metadata.className,
      options?.className || constructor.name,
      constructor,
    );
    ClassHelpers.setName(constructor, options?.className || constructor.name);
  };
}

export class FiredevProviderOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {
  // global?: boolean;
}
