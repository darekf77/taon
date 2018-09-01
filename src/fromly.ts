
import { SYMBOL } from "./symbols";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import * as _ from 'lodash';
import { getModelsMapping, describeClassProperites } from 'ng2-rest';
import { FormlyFromType } from './models';


function getFromlyConfigFor(target: Function, parentKeyPath?: string,
  keysPathesToExclude?: string[],
  keysPathesToInclude?: string[]
): FormlyFieldConfig[] {

  const mapping = getModelsMapping(target);

  // console.log(`mapping from ${target.name}`, mapping)

  const checkExclude = (_.isArray(keysPathesToExclude) && keysPathesToExclude.length > 0);
  const checkInclude = (_.isArray(keysPathesToInclude) && keysPathesToInclude.length > 0);



  if (!target[SYMBOL.FORMLY_METADATA_ARRAY]) {
    target[SYMBOL.FORMLY_METADATA_ARRAY] = [];
  } else {
    if (_.isUndefined(parentKeyPath)) { // TODO try to make this more efficeien  ???
      return target[SYMBOL.FORMLY_METADATA_ARRAY];
    }
  }

  const fieldNames = describeClassProperites(target);
  // console.log('DescribeByDefaultModel field names', fieldNames)
  let additionalConfig = [];

  const result = fieldNames.map(key => {
    if (key === '') {
      return
    }
    let type = 'input';
    let keyPath = key;
    if (parentKeyPath) {
      keyPath = `${parentKeyPath}.${key}`
    }
    // console.log(`key: ${keyPath}, parentkeyPath: ${parentKeyPath} for ${target.name}`)

    if (checkExclude && keysPathesToExclude.includes(key)) {
      return;
    }

    const prototypeDefaultValue = target.prototype[key];

    let isSimpleJStype = false;

    // console.log(`Prototype value for "${propKey}" is "${prototypeDefaultValue}"`)
    if (mapping[key] === Boolean || _.isBoolean(prototypeDefaultValue)) {
      isSimpleJStype = true;
      // console.log(`is boolean: ${key}`)
      type = ((formType: FormlyFromType) => {
        if (formType === 'material') {
          return 'toggle'
        }
      }) as any;
    }

    if (mapping[key] === Date || _.isDate(prototypeDefaultValue)) {
      isSimpleJStype = true;
      type = ((formType: FormlyFromType) => {
        if (formType === 'material') {
          return 'datepicker'
        }
      }) as any;
    }

    if (!isSimpleJStype && _.isFunction(mapping[key] && checkInclude && keysPathesToInclude.includes(key))) {
      console.log('contact this object ', (mapping[key] as Function).name)
      additionalConfig = additionalConfig.concat(
        getFromlyConfigFor(mapping[key] as Function,
          keyPath,
          keysPathesToExclude,
          keysPathesToInclude)
      );
      return;
    }

    if (_.isFunction(target.prototype[key])) {
      return;
    }
    if (_.isArray(target.prototype[key])) {
      return;
    }

    // const camelCaseKey = _.camelCase(key.split('.').join('_'));

    const res: FormlyFieldConfig = {
      key: keyPath,
      // model: _.isString(parentKey) ? parentKey : void 0,
      type,
      defaultValue: target.prototype[key],
      templateOptions: {
        label: _.isString(parentKeyPath) ? `${parentKeyPath.split('.').map(l => _.startCase(l)).join(' / ')} / ${_.startCase(key)}`
          : _.startCase(key)
      }
    };
    return res;
  }).filter(f => !!f);

  return result.concat(additionalConfig);
}

export type FormlyArrayTransformFn =
  (fieldsArray: FormlyFieldConfig[],
    fieldObject?: { [propKey: string]: FormlyFieldConfig })
    => FormlyFieldConfig[]


export function FormlyForm<T=Object>(
  fromFn?: FormlyArrayTransformFn,
  keyPathesToExclude?: (keyof T)[],
  /**
   * TODO
   */
  keyPathesToInclude?: (keyof T)[]
) {
  return function (target: Function) {

    const config = getFromlyConfigFor(target, undefined, keyPathesToExclude as any, keyPathesToInclude as any);

    //#region user override
    if (typeof fromFn === 'function') {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = fromFn(config);
    } else {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = config;
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


export function checkSyncValidators(entity: Function) {
  const fomrmlyConfig = getFormlyFrom(entity);
  let validators: Function[] = [];
  fomrmlyConfig.forEach(c => {
    validators = validators.concat(Object.keys(c.validators) as any)
  })
}

