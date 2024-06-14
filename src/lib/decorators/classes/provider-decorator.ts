import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';

export function FiredevProvider<T = any>(options?: FiredevProviderOptions<T>) {
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
  };
}

export class FiredevProviderOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {
  // global?: boolean;
}
