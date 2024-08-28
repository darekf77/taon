import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
import {
  Repository as TypeormRepository,
  EntityRepository,
} from 'taon-typeorm/src';
import { _ } from 'tnp-core/src';

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

export class TaonRepositoryOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {}
