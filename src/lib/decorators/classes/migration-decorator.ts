import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
import { _ } from 'tnp-core/src';

/**
 * Migration decorator
 */
export function TaonMigration(options: TaonMigrationOptions) {
  return function (constructor: Function) {
    Reflect.defineMetadata(
      Symbols.metadata.options.migration,
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

export class TaonMigrationOptions<
  T = any,
> extends Models.DecoratorAbstractOpt {}
