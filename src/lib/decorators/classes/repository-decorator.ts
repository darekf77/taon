import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { DecoratorAbstractOpt } from '../decorator-abstract-opt';

/**
 * Repository decorator
 */
export function TaonRepository(options: TaonRepositoryOptions) {
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
  };
}

export class TaonRepositoryOptions<T = any> extends DecoratorAbstractOpt {}
