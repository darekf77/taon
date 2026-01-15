import 'reflect-metadata';
import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { DecoratorAbstractOpt } from '../decorator-abstract-opt';

/**
 * Provider decorator
 */
export function TaonMiddleware<T = any>(
  options?: TaonMiddlewareOptions<T>,
) {
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

export class TaonMiddlewareOptions<T = any> extends DecoratorAbstractOpt {
  // middleware is a singleton for each context
}
