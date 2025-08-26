import type { TaonControllerOptions } from '../../config/controller-options';
import { ClassHelpers } from '../../helpers/class-helpers';
import { Symbols } from '../../symbols';

/**
 * Controller decorator
 */
export function TaonController<ControllerClass = any>(
  options?: TaonControllerOptions<ControllerClass>,
) {
  return function (constructor: Function) {
    ClassHelpers.setName(constructor, options?.className);
    Reflect.defineMetadata(
      Symbols.metadata.className,
      options?.className || constructor.name,
      constructor,
    );
    const cfg = ClassHelpers.ensureClassConfig(constructor);
    options = options || ({} as any);
    cfg.className = options.className || constructor.name;
    cfg.path = options.path || '';
    cfg.realtime = options.realtime;
    cfg.middlewares = options.middlewares;
  };
}
