//#region imports
import { walk } from 'lodash-walk-object/src';
import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../helpers/class-helpers';
import { cloneObj } from '../helpers/clone-obj';

//#endregion

export class BaseClass<CloneT extends BaseClass = any> {
  //#region class initialization hook
  /**
   * class initialization hook
   * taon after class instance creation
   */
  async _(): Promise<void> {}
  //#endregion

  //#region clone
  public clone(override?: Partial<CloneT>): CloneT {
    const classFn = ClassHelpers.getClassFnFromObject(this);
    return cloneObj<CloneT>(override, classFn);
  }
  //#endregion
}
