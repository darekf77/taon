//#region @backend
import * as _ from 'lodash';
import { Helpers } from "../helpers";
import { CLASS } from 'typescript-class-helpers';
import { Helpers as HelpersLog } from 'ng2-logger';

export function getTransformFunction(target: Function) {
  if (!target) {
    return;
  }

  HelpersLog.simulateBrowser = true;
  const className = CLASS.getName(target)
  target = CLASS.getBy(className);
  HelpersLog.simulateBrowser = false;
  if (!target) {
    return void 0;
  }
  const configs = Helpers.Class.getConfig(target);
  // console.log(`CONFIGS TO CHECK`, configs)
  const functions = configs
    .map(c => {
      if (_.isFunction(c.browserTransformFn)) {
        return c.browserTransformFn;
      }
    })
    .filter(f => _.isFunction(f));
  // console.log(`funcitons for ${CLASS.getName(target)}`, functions)
  return functions.length === 0 ? void 0 : function (entity) {

    for (let index = functions.length - 1; index >= 0; index--) {
      const transformFun = functions[index];
      entity = transformFun(entity)
    }
    return entity;
  }
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
