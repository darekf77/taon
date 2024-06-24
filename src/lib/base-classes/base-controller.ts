import { FiredevController } from '../decorators/classes/controller-decorator';
import { BaseInjector } from './base-injector';

@FiredevController({ className: 'BaseController' })
export class BaseController extends BaseInjector {
  /**
   * init example data for db
   */
  initExampleDbData(): Promise<any> {
    return void 0;
  }


}
