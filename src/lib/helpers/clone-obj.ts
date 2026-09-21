import { walk } from 'lodash-walk-object/src';
import { _, Helpers } from 'tnp-core/src';

/**
 * Use it to override specyfic props
 * - with primitive values (number,string, boolean)
 * - empty arrays
 * DON'T USE IT:
 * - to override arrays with values
 * - to override whole objects
 */
export const cloneObj = <CloneT>(
  override: Partial<CloneT>,
  classFn: Function,
  options?: {
    throwWhenSetError?: boolean;
  },
): CloneT => {
  options = options || {};
  const result = new (classFn as any)();
  walk.Object(
    override || {},
    (value, lodashPath) => {
      // console.log({ lodashPath });
      const valueIsEmptyArray = Array.isArray(value) && value.length === 0;
      if (
        !valueIsEmptyArray &&
        (_.isNil(value) || _.isFunction(value) || _.isObject(value))
      ) {
        // skipping
        // console.log('skipping', lodashPath);
      } else {
        // console.log('setting', lodashPath);
        if (options.throwWhenSetError) {
          // TODO QUICK_FIX when I trying to override getters
          _.set(result, lodashPath, value);
        } else {
          try {
            _.set(result, lodashPath, value);
          } catch (error) {
            // TODO QUICK_FIX ignore error when trying to override getters
          }
        }
      }
    },
    {
      walkGetters: false,
    },
  );
  // console.log({result})
  return result;
};
