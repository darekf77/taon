import { DecoratorAbstractOpt } from '../decorator-abstract-opt';

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
}
