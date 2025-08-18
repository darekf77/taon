import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';

import type { TaonControllerOptions } from './controller-options';

/**
 * Controller decorator
 */
export function TaonController<ControllerClass = any>(
  options?: TaonControllerOptions<ControllerClass>,
) {
  return function (constructor: Function) {
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
