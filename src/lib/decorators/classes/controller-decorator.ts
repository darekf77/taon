import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';
import { Models } from '../../models';
//#region @websql
import { EventSubscriber } from 'firedev-typeorm/src';
//#endregion

export function FiredevController(options?: FiredevControllerOptions) {
  return function (constructor: Function) {
    //#region @websql
    if (options?.realtime) {
      EventSubscriber()(constructor);
    }
    //#endregion

    ClassHelpers.setName(constructor, options?.className);
    Reflect.defineMetadata(
      Symbols.metadata.options.controller,
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

export class FiredevControllerOptions extends Models.DecoratorAbstractOpt {
  /**
   * typeorm realtime subscribtion // TODO disabled for now, does not make sense ?s
   */
  realtime?: boolean;
  /**
   * override default path for controller api
   */
  path?: string;
}
