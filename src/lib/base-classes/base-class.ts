//#region imports
import { walk } from 'lodash-walk-object/src';
import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../helpers/class-helpers';
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
    const result = _.merge(new classFn(), _.cloneDeep(this));
    walk.Object(
      override || {},
      (value, lodashPath) => {
        if (_.isNil(value) || _.isFunction(value) || _.isObject(value)) {
          // skipping
        } else {
          _.set(result, lodashPath, value);
        }
      },
      {
        walkGetters: false,
      },
    );
    // console.log({result})
    return result;
  }
  //#endregion
}
