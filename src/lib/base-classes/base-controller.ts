import { TaonController } from '../decorators/classes/controller-decorator';
import { BaseInjector } from './base-injector';

@TaonController({ className: 'BaseController' })
export class BaseController extends BaseInjector {
  /**
   * THIS ONLY WORKS IF NO MIGRATIONS PROVIDED IN CONFIG
   * Purpose: init example data for db.
   */
  initExampleDbData(): Promise<any> {
    return void 0;
  }
}
