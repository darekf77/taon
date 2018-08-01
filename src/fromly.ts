
import { SYMBOL } from "./SYMBOLS";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { Describer } from './helpers';
import * as _ from 'lodash';


export function FormlyForm(fromFn?: (from: FormlyFieldConfig[]) => FormlyFieldConfig[]) {
  return function (target: Function) {
    if (!target[SYMBOL.FORMLY_METADATA]) {
      target[SYMBOL.FORMLY_METADATA] = [];
    }
    if (typeof target === 'function') {
      target[SYMBOL.FORMLY_METADATA] = Describer.describe(target).map(propName => {

        let type = 'input';


        return {
          key: propName,
          type,
          templateOptions: {
            label: _.toUpper(_.kebabCase(propName))
          }
        }
      })
    }
    if (typeof fromFn === 'function') {
      target[SYMBOL.FORMLY_METADATA] = fromFn(target[SYMBOL.FORMLY_METADATA]);
    }
  }
}

export function getFromlyFrom(entity: Function) {
  return entity && entity[SYMBOL.FORMLY_METADATA];
}


