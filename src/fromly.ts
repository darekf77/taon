
import { SYMBOL } from "./SYMBOLS";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { Describer } from './helpers';
import * as _ from 'lodash';


export function FormlyForm(fromFn?:
  (fieldsArray: FormlyFieldConfig[], fieldObject?: { [propKey: string]: FormlyFieldConfig })
    => FormlyFieldConfig[]) {
  return function (target: Function) {
    if (!target[SYMBOL.FORMLY_METADATA_ARRAY]) {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = [];
    }
    if (!target[SYMBOL.FORMLY_METADATA_OBJECT]) {
      target[SYMBOL.FORMLY_METADATA_OBJECT] = [];
    }
    if (typeof target === 'function') {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = Describer.describe(target).map(propName => {

        let type = 'input';

        // if (_.isBoolean(target.prototype[propName])) {
        //   type = 'switch'
        // }

        const res = {
          key: propName,
          type,
          templateOptions: {
            label: _.startCase(propName)
          }
        }
        target[SYMBOL.FORMLY_METADATA_OBJECT][propName] = res;
        return res;
      })
    }
    if (typeof fromFn === 'function') {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = fromFn(target[SYMBOL.FORMLY_METADATA_ARRAY]);
    }
  }
}

export function getFromlyFrom(entity: Function) {
  return entity && entity[SYMBOL.FORMLY_METADATA_ARRAY];
}


