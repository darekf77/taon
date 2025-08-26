import { walk } from 'lodash-walk-object/src';
import { _ } from 'tnp-core/src';

export const cloneObj = <CloneT>(
  override: Partial<CloneT>,
  classFn: Function,
): CloneT => {
  const result = _.merge(new (classFn as any)(), _.cloneDeep(this));
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
};
