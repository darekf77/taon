import { Mapping } from 'ng2-rest/src';
import { ClassHelpers } from '../../helpers/class-helpers';
import { CLASS } from 'typescript-class-helpers/src';
import { Symbols } from '../../symbols';
import { _ } from 'tnp-core/src';
import { Models } from '../../models';
//#region @websql
import { Entity as TypeormEntity, Tree } from 'taon-typeorm/src';
//#endregion

/**
 * Entity decorator
 */
export function TaonEntity<T = any>(options?: TaonEntityOptions<T>) {
  return function (constructor: Function) {
    options = options || ({} as any);
    options.uniqueKeyProp = options.uniqueKeyProp || ('id' as any);
    ClassHelpers.setName(constructor, options?.className);

    Mapping.DefaultModelWithMapping<T>(
      options?.defaultModelValues || {},
      _.merge(
        options?.defaultModelMapping || {},
        (options?.defaultModelMappingDeep || {}) as any,
      ),
    )(constructor);

    // TODO when entit metadata generator read use this
    Mapping.DefaultModelWithMapping<T>(void 0, {})(constructor);

    Reflect.defineMetadata(
      Symbols.metadata.options.entity,
      options,
      constructor,
    );
    Reflect.defineMetadata(
      Symbols.metadata.className,
      options?.className || constructor.name,
      constructor,
    );
    //#region @websql
    TypeormEntity(options?.className)(constructor);
    //#endregion
    CLASS.setName(constructor, options?.className); // TODO QUICK_FIX for ng2-rest
  };
}

export class TaonEntityOptions<T = any> extends Models.DecoratorAbstractOpt {
  /**
   * default unique property is "id"
   * for your entity it may be something else
   */
  uniqueKeyProp?: string;
  createTable?: boolean;
  defaultModelValues?: Mapping.ModelValue<T>;
  defaultModelMapping?: Mapping.Mapping<T>;
  defaultModelMappingDeep?: { [lodashPathes: string]: string | [string] };
}
