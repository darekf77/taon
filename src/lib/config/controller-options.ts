import { DecoratorAbstractOpt } from '../decorators/decorator-abstract-opt';
import type { TaonMiddlewareFunction } from '../decorators/http/http-methods-decorators';

export class TaonControllerOptions<
  ControllerClass = any,
> extends DecoratorAbstractOpt {
  /**
   * typeorm realtime subscribtion // TODO disabled for now, does not make sense ?s
   */
  declare realtime?: boolean;
  /**
   * override default path for controller api
   */
  declare path?: string;
  /**
   * Middlewares to be applied to all methods in the controller
   */
  declare middlewares?: TaonMiddlewareFunction;
}
