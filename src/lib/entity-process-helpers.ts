//#region imports
import type { Response } from 'express';
import { walk } from 'lodash-walk-object/src';
import { decodeMappingForHeaderJson } from 'ng2-rest/src';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-core/src';

import { ClassHelpers } from './helpers/class-helpers';
import { Symbols } from './symbols';
import { Models } from './models';
//#endregion

//#region get transform function
/**
 * @deprecated
 */
export const getTransformFunction = (target: Function) => {
  if (!target) {
    return;
  }

  // const className = ClassHelpers.getName(target)
  // target = ClassHelpers.getBy(className);

  if (!target) {
    return void 0;
  }
  const configs = ClassHelpers.getControllerConfigs(target);
  // console.log(`CONFIGS TO CHECK`, configs)
  const functions = configs
    .map(c => {
      if (_.isFunction(c.browserTransformFn)) {
        return c.browserTransformFn;
      }
    })
    .filter(f => _.isFunction(f));
  return functions.length === 0
    ? void 0
    : function (entity) {
        for (let index = functions.length - 1; index >= 0; index--) {
          const transformFun = functions[index];
          transformFun(entity);
        }
        return entity;
      };
};
//#endregion

//#region single transform
/**
 * @deprecated
 */
export const singleTransform = (json: any) => {
  let ptarget = ClassHelpers.getClassFnFromObject(json);
  let pbrowserTransformFn = getTransformFunction(ptarget);
  if (pbrowserTransformFn) {
    const newValue = pbrowserTransformFn(json);
    if (!_.isObject(newValue)) {
      console.error(
        `Please return object in transform function for class: ` +
          `${ClassHelpers.getName(json)}`,
      );
    } else {
      json = newValue;
    }
  }
  return json;
};
//#endregion

//#region apply transform function
export const applayTransformFn = (data: any) => {
  if (_.isObject(data) && !_.isArray(data)) {
    data = singleTransform(data);
  }
  const { include } = { include: [] };
  walk.Object(
    data,
    (value, lodashPath, changeValue, { skipObject, isCircural }) => {
      // console.log(`${isCircural ? 'CIR' : 'NOT'} : ${lodashPath}`)
      if (!isCircural) {
        if (!_.isArray(value) && _.isObject(value)) {
          changeValue(singleTransform(value));
        }
      }
    },
    { checkCircural: true, breadthWalk: true, include, walkGetters: false },
  );

  const { circs } = walk.Object(data, void 0, {
    checkCircural: true,
    breadthWalk: true,
    walkGetters: false,
    include,
  });

  return { circs, data };
};
//#endregion
