import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
import {
  Repository as TypeormRepository,
  EntityRepository,
} from 'firedev-typeorm/src';
import { _ } from 'tnp-core/src';

export function FiredevRepository(options: FiredevRepositoryOptions) {
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
  };
}

export class FiredevRepositoryOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {}
