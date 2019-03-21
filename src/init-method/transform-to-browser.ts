//#region @backend
import * as _ from 'lodash';
import { Helpers } from "../helpers";

export function getTransformFunction(target: Function) {
  if (!target) {
    return;
  }
  const configs = Helpers.Class.getConfig(target);
  // console.log(`CONFIGS TO CHECK`, configs)
  const functions = configs
    .map(c => {
      if (_.isFunction(c.browserTransformFn)) {
        return c.browserTransformFn;
      }
    })
    .filter(f => !!f);
  return _.first(functions);
}

export function singleTransform(json) {

  let ptarget = Helpers.Class.getFromObject(json);
  let pbrowserTransformFn = getTransformFunction(ptarget);
  if (pbrowserTransformFn) {
    const newValue = pbrowserTransformFn(json)
    if (!_.isObject(newValue)) {
      console.error(`Please return object in transform function for class: ${Helpers.Class.getNameFromObject(json)}`)
    } else {
      json = newValue;
    }
  }
  return json;
}

//#endregion
