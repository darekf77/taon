import { FiredevController } from '../decorators/classes/controller-decorator';
import { EndpointContext } from '../endpoint-context';
import { Symbols } from '../symbols';
import { BaseClass } from './base-class';

@FiredevController({ className: 'BaseController' })
export class BaseController extends BaseClass {
  /**
   * init example data for db
   */
  initExampleDbData(): Promise<any> {
    return void 0;
  }
}
