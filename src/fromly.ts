
import { SYMBOL } from "./SYMBOLS";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { Describer } from './helpers';
import * as _ from 'lodash';
import { getModelsMapping } from './models-mapping';
import { FormlyFromType } from './models';


function getFromlyConfigFor(target: Function, mapping?: Object, parentKey?: string): FormlyFieldConfig[] {

  if (!mapping) {
    mapping = getModelsMapping(target);
  }

  if (!target[SYMBOL.FORMLY_METADATA_ARRAY]) {
    target[SYMBOL.FORMLY_METADATA_ARRAY] = [];
  } else {
    return target[SYMBOL.FORMLY_METADATA_ARRAY];
  }

  const fieldNames = Describer.describeByDefaultModel(target);
  let additionalConfig = [];
  const result = fieldNames.map(key => {
    if (key === '') {
      return
    }
    let type = 'input';
    let model = key;

    //#region boolean
    if (mapping[key] === Boolean || _.isBoolean(target.prototype[key])) {
      type = ((formType: FormlyFromType) => {
        if (formType === 'material') {
          return 'toggle'
        }
      }) as any;
    }
    //#endregion

    //#region Date
    let isDate = false;
    if (mapping[key] === Date || _.isDate(target.prototype[key])) {
      isDate = true;
      type = ((formType: FormlyFromType) => {
        if (formType === 'material') {
          return 'datepicker'
        }
      }) as any;
    }
    //#endregion


    if (!isDate && (_.isObject(target.prototype[key] || ))) {
      return;
    }

    if (!isDate && _.isFunction(mapping[key])) {
      additionalConfig = additionalConfig.concat(getFromlyConfigFor(target, mapping, key));
    }

    if (_.isFunction(target.prototype[key])) {
      return;
    }
    if (_.isArray(target.prototype[key])) {
      return;
    }

    const res: FormlyFieldConfig = {
      key,
      model: (model == key) ? undefined : model,
      type,
      templateOptions: {
        label: _.startCase(key)
      }
    };
    return res;
  }).filter(f => !!f);


  return result.concat(additionalConfig);
}


export function FormlyForm(fromFn?:
  (fieldsArray: FormlyFieldConfig[], fieldObject?: { [propKey: string]: FormlyFieldConfig })
    => FormlyFieldConfig[]) {
  return function (target: Function) {

    target[SYMBOL.FORMLY_METADATA_ARRAY] = getFromlyConfigFor(target);


    //#region user override
    if (typeof fromFn === 'function') {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = fromFn(target[SYMBOL.FORMLY_METADATA_ARRAY]);
    }
    //#endregion
  }
}



export function getFormlyFrom(entity: Function, formType: FormlyFromType = 'material'): FormlyFieldConfig[] {
  if (!entity) {
    return;
  }
  if (_.isArray(entity[SYMBOL.FORMLY_METADATA_ARRAY])) {
    return (entity[SYMBOL.FORMLY_METADATA_ARRAY] as Array<FormlyFieldConfig>)
      .map(field => {
        if (_.isFunction(field.type)) {
          field.type = field.type(formType);
        }
        return field;
      })
  }
}


