import { DecoratorAbstractOpt } from '../decorator-abstract-opt';
import type { TaonMiddlewareFunction } from '../http/http-methods-decorators';

export class TaonControllerOptions<
  ControllerClass = any,
> extends DecoratorAbstractOpt {
  /**
   * typeorm realtime subscribtion // TODO disabled for now, does not make sense ?s
   */
  realtime?: boolean;
  /**
   * override default path for controller api
   */
  path?: string;
  /**
   * Middlewares to be applied to all methods in the controller
   */
  middlewares?: TaonMiddlewareFunction;
}
