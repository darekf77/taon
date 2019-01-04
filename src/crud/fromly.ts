
import { SYMBOL } from "../symbols";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger';
import { Helpers } from '../helpers';
import { Mapping } from 'ng2-rest';
import { Models } from '../models';

const log = Log.create('[morphi] formly')

type FormlyInputType = 'input' | 'toogle' | 'datepicker' | 'repeat'
export function getFromlyConfigFor(
  target: Function,
  formType: 'material' | 'bootstrap' = 'material',
  keysPathesToInclude: string[] = [],
  keysPathesToExclude: string[] = [],
  parentKeyPath?: string
) {

  if (Helpers.Class.getName(target) === 'Project') {
    return [];
  }

  const mapping: Mapping.Mapping = Mapping.getModelsMapping(target);
  const fieldNames = Helpers.Class.describeProperites(target);
  const checkExclude = (_.isArray(keysPathesToExclude) && keysPathesToExclude.length > 0);
  const checkInclude = (_.isArray(keysPathesToInclude) && keysPathesToInclude.length > 0);

  function fields(override?: FormlyFieldConfig[]): FormlyFieldConfig[] {
    if (!_.isUndefined(override)) {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = override;
    }
    if (!target[SYMBOL.FORMLY_METADATA_ARRAY]) {
      target[SYMBOL.FORMLY_METADATA_ARRAY] = [];
    }
    return target[SYMBOL.FORMLY_METADATA_ARRAY]
  }



  function inputToPush(key: string, type: FormlyInputType, targetChild?: Function) {
    let res: FormlyFieldConfig;
    if (type === 'repeat') {
      res = {
        key,
        type,
        fieldArray: {
          fieldGroupClassName: 'row',
          templateOptions: {
            btnText: _.upperCase(key),
          },
          fieldGroup: getFromlyConfigFor(targetChild, formType, keysPathesToInclude, keysPathesToExclude, `${parentKeyPath}${key}`)
        }
      }
    } else {
      res = {
        key,
        type,
        defaultValue: !_.isUndefined(target.prototype[key]) ? target.prototype[key] : undefined,
        templateOptions: {
          label: _.isString(parentKeyPath) ? `${parentKeyPath.split('.').map(l => _.startCase(l)).join(' / ')} / ${_.startCase(key)}`
            : _.startCase(key)
        }
      }
    }
    return res;
  }

  function resolveSimpleTypes() {
    for (const key in target.prototype) {
      if (target.prototype.hasOwnProperty(key)) {
        const element = target.prototype[key];
        let type: FormlyInputType = 'input';
        if (_.isBoolean(element)) {
          type = 'toogle'
        } else if (_.isDate(element)) {
          type = 'datepicker'
        }
        fields().push(inputToPush(key, type))
      }
    }
  }

  function resolveComplexTypes() {

    fieldNames.forEach(key => {

      if (!_.isUndefined(mapping[key])) {
        let className = mapping[key]
        const isArray = _.isArray(className)
        className = isArray ? _.first(className) : className;
        const targetChild = Helpers.Class.getBy(className);

        if (targetChild) {
          if (isArray) {
            fields().push(inputToPush(key, 'repeat', targetChild))
          } else {
            const fieldsFromChild = getFromlyConfigFor(targetChild, formType, keysPathesToInclude, keysPathesToExclude, `${parentKeyPath}${key}`)
            fields(fields().concat(fieldsFromChild))
          }
        }

      }
    })
  }

  function generate() {
    resolveSimpleTypes();
    resolveComplexTypes()
  }

  generate()
  return fields()
}

// function getFromlyConfigFor(target: Function, parentKeyPath?: string,
//   keysPathesToExclude?: string[],
//   keysPathesToInclude?: string[]
// ): FormlyFieldConfig[] {
//   // log.onlyWhen(target.name === 'CATEGORY')
//   if(target.name === 'Project') {
//     return [];
//   }
//   const mapping = Mapping.getModelsMapping(target);
//   console.log(`mapping from ${target.name}`, mapping)
//   // log.i(`mapping from ${target.name}`, mapping)

//   const checkExclude = (_.isArray(keysPathesToExclude) && keysPathesToExclude.length > 0);
//   const checkInclude = (_.isArray(keysPathesToInclude) && keysPathesToInclude.length > 0);

//   // log.i('keysPathesToExclude', keysPathesToExclude)
//   // log.i('checkInclude', checkInclude)

//   if (!target[SYMBOL.FORMLY_METADATA_ARRAY]) {
//     target[SYMBOL.FORMLY_METADATA_ARRAY] = [];
//   } else {
//     if (_.isUndefined(parentKeyPath)) { // TODO try to make this more efficeien  ???
//       return target[SYMBOL.FORMLY_METADATA_ARRAY];
//     }
//   }

//   const fieldNames = Helpers.Class.describeProperites(target);
//   log.i(`describeClassProperites for ${target.name}`, fieldNames)
//   let additionalConfig = [];

//   const result = fieldNames.map(key => {
//     if (key === '') {
//       return
//     }
//     let type = 'input';
//     let keyPath = key;
//     if (parentKeyPath) {
//       keyPath = `${parentKeyPath}.${key}`
//     }
//     // console.log(`key: ${keyPath}, parentkeyPath: ${parentKeyPath} for ${target.name}`)

//     if (checkExclude && keysPathesToExclude.includes(key)) {
//       return;
//     }

//     const prototypeDefaultValue = target.prototype[key];
//     console.log('DEFAULT VALUE: ', prototypeDefaultValue)
//     let isSimpleJStype = false;

//     // console.log(`Prototype value for "${propKey}" is "${prototypeDefaultValue}"`)
//     if (mapping[key] === Boolean || _.isBoolean(prototypeDefaultValue)) {
//       isSimpleJStype = true;
//       // console.log(`is boolean: ${key}`)
//       type = ((formType: Models.FormlyFromType) => {
//         if (formType === 'material') {
//           return 'toggle'
//         }
//       }) as any;
//     }

//     if (mapping[key] === Date || _.isDate(prototypeDefaultValue)) {
//       isSimpleJStype = true;
//       type = ((formType: Models.FormlyFromType) => {
//         if (formType === 'material') {
//           return 'datepicker'
//         }
//       }) as any;
//     }

//     if (!isSimpleJStype && _.isFunction(mapping[key] && checkInclude && keysPathesToInclude.includes(key))) {
//       // console.log('contact this object ', (mapping[key] as Function).name)
//       additionalConfig = additionalConfig.concat(
//         getFromlyConfigFor(mapping[key] as Function,
//           keyPath,
//           keysPathesToExclude,
//           keysPathesToInclude)
//       );
//       return;
//     }

//     if (_.isFunction(target.prototype[key])) {
//       return;
//     }
//     if (_.isArray(target.prototype[key])) {
//       return;
//     }

//     // const camelCaseKey = _.camelCase(key.split('.').join('_'));

//     const res: FormlyFieldConfig = {
//       key: keyPath,
//       // model: _.isString(parentKey) ? parentKey : void 0,
//       type,
//       defaultValue: target.prototype[key],
//       templateOptions: {
//         label: _.isString(parentKeyPath) ? `${parentKeyPath.split('.').map(l => _.startCase(l)).join(' / ')} / ${_.startCase(key)}`
//           : _.startCase(key)
//       }
//     };
//     return res;
//   }).filter(f => !!f);

//   return result.concat(additionalConfig);
// }

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
      // console.log('just add to class config', config)
      target[SYMBOL.FORMLY_METADATA_ARRAY] = config;
    }
    //#endregion
  }
}

export interface AutoFromlyFormOptions {
  formType?: Models.FormlyFromType;
}


export function getFormlyFrom(entity: Function, options: AutoFromlyFormOptions = { formType: 'material' }): FormlyFieldConfig[] {
  const { formType = 'material' } = options;
  if (!entity) {
    return;
  }
  // console.log('entity[SYMBOL.FORMLY_METADATA_ARRAY]', entity[SYMBOL.FORMLY_METADATA_ARRAY])
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

