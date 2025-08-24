import type { BaseMiddleware } from '../../base-classes/base-middleware';
import { Models } from '../../models';
import { TaonMiddlewareInheritanceObj } from '../http/http-methods-decorators';

import { TaonControllerOptions } from './controller-options';

export class ControllerConfig extends TaonControllerOptions {
  methods: { [methodName: string]: Models.MethodConfig } = {};
  /**
   * Calculated path from parents controllers
   */
  calculatedPath?: string;
  /**
   * a way to transform entity before sending to browser
   */
  browserTransformFn?: (entity: any) => any;
  /**
   * Calculated middlewares object from parents controllers
   */
  calculatedMiddlewaresControllerObj?: TaonMiddlewareInheritanceObj;
}
