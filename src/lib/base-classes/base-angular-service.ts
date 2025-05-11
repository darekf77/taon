import { Injectable, inject } from '@angular/core'; // @browser

import { TAON_CONTEXT } from '../constants';
import { TaonContext } from '../create-context';

/**
 * TODO prevent calling methods when not initialized
 * with init(ctx)
 */
//#region @browser
@Injectable()
//#endregion
export abstract class BaseAngularsService {
  //#region @browser
  currentContext: TaonContext = inject(TAON_CONTEXT);
  //#endregion
}
