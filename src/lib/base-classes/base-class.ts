//#region imports
import { walk } from 'lodash-walk-object/src';
import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../helpers/class-helpers';
import { cloneObj } from '../helpers/clone-obj';

//#endregion

export class TaonBaseClass<CloneT extends TaonBaseClass = any> {
  //#region class initialization hook
  /**
   * class initialization hook
   * taon after class instance creation
   */
  async _(): Promise<void> {}
  //#endregion

  //#region clone
  /**
   *
   * @param overrideObjOrFn if object is provided it will override values in cloned object,
   * if function is provided it will be called with old cloned values and should return
   * object with values to override
   * @returns cloned instance of the class
   */
  public clone(
    overrideObjOrFn?:
      | Partial<CloneT>
      | ((oldValues: Partial<CloneT>) => Partial<CloneT>),
  ): CloneT {
    if(_.isString(overrideObjOrFn)) {
      console.log(overrideObjOrFn);
      throw new Error('String is not supported as .clone() method argument');
    }
    const classFn = ClassHelpers.getClassFnFromObject(this);
    if (_.isFunction(overrideObjOrFn)) {
      // console.log('clone with fn');
      const oldValues = (_.cloneDeep(this) || {}) as any as Partial<CloneT>;
      return cloneObj<CloneT>(overrideObjOrFn(oldValues), classFn);
    }
    // console.log('clone normal');
    return cloneObj<CloneT>(overrideObjOrFn as any, classFn);
  }
  //#endregion
}
