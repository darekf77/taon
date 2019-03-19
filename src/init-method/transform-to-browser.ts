//#region @backend
import * as _ from 'lodash';
import { Helpers } from "../helpers";
import { walk } from 'lodash-walk-object';

export function getPathesWithTransformFnEntites(result: any): (string | Object)[] {
  const pathes = [];

  let fun = getTransformFunction(result)
  if (_.isFunction(fun)) {
    pathes.push(result)
  }

  walk.Object(result, (value, lodashPath, changeValue, { isGetter }) => {
    fun = getTransformFunction(result)
    if (_.isFunction(fun)) {
      pathes.push(lodashPath)
    }
  });

  return pathes;
}

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

function singleTransform(json) {

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


export function transformToBrowserVersion(json: any, removeCirc: (json: any) => any) {

  json = singleTransform(json)

  json = removeCirc(json)

  const alreadyRunnedFoR = [];
  // let countStable = 0;
  while (true) {
    // countStable++;
    let isStable = true;
    walk.Object(json, (value, lodashPath, changeValue, { exit }) => {
      if (!alreadyRunnedFoR.includes(lodashPath) && !_.isArray(value) && _.isObject(value)) {
        // mesureTime((note) => {

        const before = JSON.stringify(json); // Helpers.JSON.structureArray(jsonObject); //TODO second is slowe but more sure ??? or am wrong... I don't know
        changeValue(singleTransform(value))
        const j = removeCirc(json)
        const after = JSON.stringify(j); // Helpers.JSON.structureArray(j);
        if (!_.isEqual(before, after)) {
          isStable = false
          json = j;
          exit()
        }
        alreadyRunnedFoR.push(lodashPath)
        // note(`End for ${lodashPath}`)
        // })

      }
    })
    if (isStable) {
      // console.log(`Stable after ${countStable} `)
      break;
    }
  }




  return json;
}

//#endregion
