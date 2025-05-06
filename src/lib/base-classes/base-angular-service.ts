import { Injectable } from '@angular/core'; // @browser

import { TaonContext } from '../create-context';

/**
 * TODO prevent calling methods when not initialized
 * with init(ctx)
 */
//#region @browser
@Injectable()
//#endregion
export abstract class BaseAngularsService {
  protected currentContext: TaonContext;
  public init(currentContext: TaonContext): void {
    this.currentContext = currentContext;
    this.initControllers();
  }

  protected abstract initControllers(): void;
}
