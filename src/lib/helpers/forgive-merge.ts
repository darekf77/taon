import { _ } from 'tnp-core/src';

export function forgiveMerge<T extends object>(
  target: T,
  source?: Partial<T>,
): T {
  if (_.isNil(source)) {
    return target;
  }

  const merge = (targetObj: any, sourceObj: any): any => {
    for (const key of Reflect.ownKeys(sourceObj)) {
      let sourceValue: any;

      try {
        sourceValue = sourceObj[key];
      } catch {
        // Forgive throwing getters.
        continue;
      }

      // Arrays should be replaced, not index-merged like _.merge().
      if (Array.isArray(sourceValue)) {
        try {
          targetObj[key] = _.cloneDeep(sourceValue);
        } catch {
          // Forgive readonly/getter-only properties.
        }
        continue;
      }

      if (sourceValue !== null && typeof sourceValue === 'object') {
        let targetValue: any;

        try {
          targetValue = targetObj[key];
        } catch {
          // Getter itself throws.
          continue;
        }

        if (
          targetValue !== null &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          merge(targetValue, sourceValue);
          continue;
        }

        try {
          targetObj[key] = _.cloneDeep(sourceValue);
        } catch {
          // Forgive readonly/getter-only properties.
        }

        continue;
      }

      try {
        targetObj[key] = sourceValue;
      } catch {
        // Forgive readonly/getter-only properties.
      }
    }

    return targetObj;
  };

  return merge(target, source);
}
