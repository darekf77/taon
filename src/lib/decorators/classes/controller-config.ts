import { Models } from '../../models';

import { TaonControllerOptions } from './controller-options';
export class ControllerConfig extends TaonControllerOptions {
  methods: { [methodName: string]: Models.MethodConfig } = {};
  calculatedPath?: string;
  browserTransformFn?: (entity: any) => any;
}
