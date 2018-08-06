



import { SYMBOL } from "./SYMBOLS";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { Describer } from './helpers';
import * as _ from 'lodash';

export type ModelsMappingObject<T> = {
  /**
   * Inside models types
   */
  [propName in keyof T]?: Function;
};

export type ModelValue<T> = {
  /**
   * Inside models types
   */
  [propName in keyof T]?: T[propName];
};

function getDefaultMappingModel(target) {
  return ({
    '': target
  })
}

export function DefaultModelWithMapping<T=Object>(
  defaultModelValues: ModelValue<T>,
  mapping?: ModelsMappingObject<T>
) {
  return function (target: Function) {

    if (!target[SYMBOL.MODELS_MAPPING]) {
      target[SYMBOL.MODELS_MAPPING] = getDefaultMappingModel(target);
    }
    _.merge(target[SYMBOL.MODELS_MAPPING], mapping);

    // console.info(`IAM IN DefaultModel`)
    if (_.isObject(defaultModelValues)) {
      const toMerge = {};
      const describedTarget = Describer.describe(target)
      // console.log(`describedTarget: ${describedTarget} for ${target.name}`)
      describedTarget.forEach(propDefInConstr => {
        if (defaultModelValues[propDefInConstr]) {
          console.warn(`

          WARING: default value for property: "${propDefInConstr}"
          in class "${target.name}" already defined as typescript
          default class proprty value.

          `)
        } else {
          toMerge[propDefInConstr] = null; // TODO from toString I can't know that
        }
      });

      // console.log(`merge "${JSON.stringify(target.prototype)}" with "${JSON.stringify(defaultModelValues)}"`)

      target[SYMBOL.DEFAULT_MODEL] = _.merge(toMerge, defaultModelValues);
      _.merge(target.prototype, target[SYMBOL.DEFAULT_MODEL])
    }
  }
}

export function getEntityFieldsProperties(target: Function): string[] {
  let res = {}
  if (target) {
    if (target[SYMBOL.DEFAULT_MODEL]) {
      Object.keys(target[SYMBOL.DEFAULT_MODEL])
        .filter(key => !_.isFunction(target[SYMBOL.DEFAULT_MODEL][key]))
        .forEach(key => res[key] = null);
    }
    if (target[SYMBOL.MODELS_MAPPING]) {
      Object.keys(target[SYMBOL.MODELS_MAPPING])
        .forEach(key => res[key] = null);
    }
  }
  return Object.keys(res);
}


export function getModelsMapping(entity: Function) {
  if (_.isUndefined(entity)) {
    return;
  }
  if (!_.isFunction(entity)) {
    return;
  }
  if (_.isObject(entity[SYMBOL.MODELS_MAPPING])) {
    return entity[SYMBOL.MODELS_MAPPING]
  }
  return getDefaultMappingModel(entity);
}



