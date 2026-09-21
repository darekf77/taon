//#region imports
import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../helpers/class-helpers';
import { cloneObj } from '../helpers/clone-obj';
import { forgiveMerge } from '../helpers/forgive-merge';

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
   * Use it to override specyfic props
   * - with primitive values (number,string, boolean)
   * - empty arrays
   * DON'T USE IT:
   * - to override arrays with values
   * - to override whole objects
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
    if (_.isString(overrideObjOrFn)) {
      console.log(overrideObjOrFn);

      throw new Error('String is not supported as .clone() method argument');
    }

    const classFn = ClassHelpers.getClassFnFromObject(this);

    const oldValues = _.cloneDeep(this as any) as Partial<CloneT>;

    const overrides = _.isFunction(overrideObjOrFn)
      ? overrideObjOrFn(oldValues)
      : overrideObjOrFn;

    return cloneObj<CloneT>(forgiveMerge(oldValues, overrides), classFn);
  }
  //#endregion
}
