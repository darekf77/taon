//#region @backend
import { _ } from 'tnp-core';
import { CLASS } from 'typescript-class-helpers';
import { Helpers  } from 'tnp-core';
import { ModelDataConfig } from '../crud';

export function getTransformFunction(target: Function, mdc: ModelDataConfig) {
  if (!target) {
    return;
  }

  Helpers.simulateBrowser = true;
  const className = CLASS.getName(target)
  target = CLASS.getBy(className);
  Helpers.simulateBrowser = false;
  if (!target) {
    return void 0;
  }
  const configs = CLASS.getConfigs(target);
  // console.log(`CONFIGS TO CHECK`, configs)
  const functions = configs
    .map(c => {
      if (_.isFunction(c.browserTransformFn)) {
        return c.browserTransformFn;
      }
    })
    .filter(f => _.isFunction(f));
  // console.log(`funcitons for ${CLASS.getName(target)}`, functions)
  return (functions.length === 0) ? (void 0) : function (entity) {

    for (let index = functions.length - 1; index >= 0; index--) {
      const transformFun = functions[index];
      transformFun(entity, mdc)
    }
    return entity;
  }
}

export function singleTransform(json: any, mdc: ModelDataConfig) {

  let ptarget = CLASS.getFromObject(json);
  let pbrowserTransformFn = getTransformFunction(ptarget, mdc);
  if (pbrowserTransformFn) {
    const newValue = pbrowserTransformFn(json)
    if (!_.isObject(newValue)) {
      console.error(`Please return object in transform function for class: ${CLASS.getNameFromObject(json)}`)
    } else {
      json = newValue;
    }
  }
  return json;
}

//#endregion
