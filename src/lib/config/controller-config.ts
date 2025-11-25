// import type { TaonBaseMiddleware } from '../base-classes/base-middleware';
import { TaonMiddlewareInheritanceObj } from '../decorators/http/http-methods-decorators';
// import { cloneObj } from '../helpers/clone-obj';

import { TaonControllerOptions } from './controller-options';
import { MethodConfig } from './method-config';
// import { ParamConfig } from './param-config';

export class ControllerConfig extends TaonControllerOptions {
  declare methods: { [methodName: string]: Partial<MethodConfig> };
  /**
   * Calculated path from parents controllers
   */
  declare calculatedPath?: string;
  /**
   * a way to transform entity before sending to browser
   */
  declare browserTransformFn?: (entity: any) => any;
  /**
   * Calculated middlewares object from parents controllers
   */
  declare calculatedMiddlewaresControllerObj?: TaonMiddlewareInheritanceObj;

  // ! CLONING WILL CONE DESCRIPTOR OF METHOD AND I NEED IT!
  // public clone(override?: Partial<ControllerConfig>): ControllerConfig {
  //   return cloneObj<ControllerConfig>(override, ControllerConfig);
  // }
}

export const controllerConfigFrom = (
  partial: Partial<ControllerConfig>,
): ControllerConfig => {
  const newObj: ControllerConfig = partial || ({} as any);
  newObj.methods = newObj.methods || {};
  for (const methodName in newObj.methods) {
    if (newObj.methods.hasOwnProperty(methodName)) {
      // newObj.methods[methodName] = new MethodConfig().clone(
      //   newObj.methods[methodName],
      // );

      newObj.methods[methodName] = newObj.methods[methodName] || {};

      const params =
        (newObj.methods[methodName] as MethodConfig).parameters || {};
      (newObj.methods[methodName] as MethodConfig).parameters = params
        ? params
        : {};

      for (const paramName in params) {
        if (params.hasOwnProperty(paramName)) {
          params[paramName] = params[paramName] || {};
          // params[paramName] = new ParamConfig().clone(params[paramName]);
        }
      }
    }
  }
  return newObj;
};
