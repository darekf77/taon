import { Mapping } from "ng2-rest/src";
import { ClassHelpers } from "../../helpers/class-helpers";
import { Symbols } from "../../symbols";
import { _ } from 'tnp-core';
import { Models } from "../../models";


export function FiredevEntity<T = any>(options?: FiredevEntityOptions<T>) {
  return function (constructor: Function) {
    options = options || {} as any;
    options.uniqueKeyProp = options.uniqueKeyProp || 'id' as any;
    ClassHelpers.setName(constructor, options?.className);

    Mapping.DefaultModelWithMapping<T>(
      options?.defaultModelValues || {},
      _.merge(
        options?.defaultModelMapping || {},
        (options?.defaultModelMappingDeep || {}) as any)
    )(constructor)

    // TODO when entit metadata generator read use this
    Mapping.DefaultModelWithMapping<T>(void 0, {})(constructor);

    Reflect.defineMetadata(Symbols.metadata.options.entity, options, constructor);
    Reflect.defineMetadata(Symbols.metadata.className, options?.className || constructor.name, constructor);
  };
}

export class FiredevEntityOptions<T = any> extends Models.DecoratorAbstractOpt {
  /**
   * default unique property is "id"
   * for your entity it may be something else
   */
  uniqueKeyProp?: string;
  createTable?: boolean;
  defaultModelValues?: Mapping.ModelValue<T>;
  defaultModelMapping?: Mapping.Mapping<T>;
  defaultModelMappingDeep?: { [lodashPathes: string]: string | [string]; }

}
