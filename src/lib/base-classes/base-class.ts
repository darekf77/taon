//#region imports
import { Helpers, _ } from 'tnp-core/src';
import { EndpointContext } from '../endpoint-context';
import { Symbols } from '../symbols';
import { ClassHelpers } from '../helpers/class-helpers';
import type { BaseRepository } from './base-repository';
//#region @browser
import { inject } from '@angular/core';
//#endregion
//#endregion

export class BaseClass<CloneT extends BaseClass = any> {
  //#region class initialization hook
  /**
   * class initialization hook
   * taon after class instance creation
   */
  async _() {}
  //#endregion

  //#region clone
  public clone(override: Partial<CloneT>): CloneT {
    const classFn = ClassHelpers.getClassFnFromObject(this);
    const result = _.merge(new classFn(), _.merge(_.cloneDeep(this), override));
    // console.log({result})
    return result;
  }
  //#endregion
}
