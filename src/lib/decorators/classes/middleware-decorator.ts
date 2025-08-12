import { ClassHelpers } from '../../helpers/class-helpers';
import { Models } from '../../models';
import { Symbols } from '../../symbols';

/**
 * Provider decorator
 */
export function TaonMiddleware<T = any>(options?: TaonMiddlewareOptions<T>) {
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

export class TaonMiddlewareOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {
  // global?: boolean;
}
