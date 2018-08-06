
import { SYMBOL } from "./SYMBOLS";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import { Describer } from './helpers';
import * as _ from 'lodash';
import { getModelsMapping } from './models-mapping';
import { FormlyFromType } from './models';


function getFromlyConfigFor(target: Function, parentKey?: string): FormlyFieldConfig[] {

  const mapping = getModelsMapping(target);


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
    const propKey = key;
    if (parentKey) {
      key = `${parentKey}.${key}`
    }

    const prototypeDefaultValue = _.get(target.prototype, key);


    if (mapping[key] === Boolean || _.isBoolean(prototypeDefaultValue)) {
      type = ((formType: FormlyFromType) => {
        if (formType === 'material') {
          return 'toggle'
        }
      }) as any;
    }

    let isDate = false;
    if (mapping[key] === Date || _.isDate(prototypeDefaultValue)) {
      isDate = true;
      type = ((formType: FormlyFromType) => {
        if (formType === 'material') {
          return 'datepicker'
        }
      }) as any;
    }

    if (!isDate && _.isFunction(mapping[key])) {
      additionalConfig = additionalConfig.concat(getFromlyConfigFor(mapping[key], key));
    }

    if (_.isFunction(target.prototype[key])) {
      return;
    }
    if (_.isArray(target.prototype[key])) {
      return;
    }

    const camelCaseKey = _.camelCase(key.split('.').join('_'));

    const res: FormlyFieldConfig = {
      key: propKey,
      model: parentKey ? `model.${parentKey}` : void 0,
      type,
      templateOptions: {
        label: _.startCase(propKey)
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

    const config = getFromlyConfigFor(target);

    //#region user override
    if (typeof fromFn === 'function') {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = fromFn(config);
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


