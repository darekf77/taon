//#region models / method config

import { CoreModels } from 'tnp-core/src';

import type { TaonBaseMiddleware } from '../base-classes/base-middleware';
import type {
  TaonHttpDecoratorOptions,
  TaonMiddlewareFunction,
  TaonMiddlewareInheritanceObj,
} from '../decorators/http/http-methods-decorators';

import { ParamConfig } from './param-config';

/**
 * @link './decorators/http/http-methods-decorators.ts' TaonHttpDecoratorOptions
 */
export class MethodConfig
  implements Pick<TaonHttpDecoratorOptions, 'path' | 'middlewares'>
{
  declare methodName: string;

  declare global?: boolean;
  /**
   * override default content type
   */
  declare contentType?: any;
  /**
   * override default axiso response type
   */
  declare responseType?: any;
  declare overrideExpressSendAsHtml?: boolean;
  declare path: string;
  declare descriptor: PropertyDescriptor;
  declare type: CoreModels.HttpMethod;
  declare parameters: { [paramName: string]: Partial<ParamConfig> };
  /**
   * Middlewares from controller method options
   */
  declare middlewares?: TaonMiddlewareFunction;
  /**
   * Calculated middlewares object from parents controllers
   */
  declare calculatedMiddlewaresMethodObj?: TaonMiddlewareInheritanceObj;
  /**
   * Middlewares array in proper order and ready to be used in
   * express or in axios interceptors.
   */
  declare calculatedMiddlewares: (typeof TaonBaseMiddleware)[];

  // ! CLONING WILL CONE DESCRIPTOR OF METHOD AND I NEED IT!
  // public clone(override?: Partial<MethodConfig>): MethodConfig {
  //   return cloneObj<MethodConfig>(override, MethodConfig);
  // }
}
//#endregion
