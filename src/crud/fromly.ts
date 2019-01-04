
import { SYMBOL } from "../symbols";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';
import * as _ from 'lodash';
import { Log, Level } from 'ng2-logger';
import { Helpers } from '../helpers';
import { Mapping } from 'ng2-rest';
import { Models } from '../models';

const log = Log.create('[morphi] formly')

type FormlyInputType = 'input' | 'switch' | 'datepicker' | 'repeat' | 'group'
export function getFromlyConfigFor(
  target: Function,
  options: {
    formType?: 'material' | 'bootstrap';
    keysPathesToInclude?: string[];
    keysPathesToExclude?: string[];
    parentModel?: string;
    relativePath?: string;
    level?: number;
    maxLevel?: number;
  } = {}
) {
  const { formType = 'material', keysPathesToExclude = [], keysPathesToInclude = [],
    parentModel, relativePath = '', level = 0, maxLevel = 4,
  } = options;

  if (Helpers.Class.getName(target) === 'Project') {
    return [];
  }

  if (level === maxLevel) {
    return [];
  }

  const mapping: Mapping.Mapping = Mapping.getModelsMapping(target);
  // console.log('mapping', mapping)
  const fieldNames = Helpers.Class.describeProperites(target);
  const checkExclude = (_.isArray(keysPathesToExclude) && keysPathesToExclude.length > 0);
  const checkInclude = (_.isArray(keysPathesToInclude) && keysPathesToInclude.length > 0);
  if (checkExclude && checkInclude) {
    throw `In morphi function getFromlyConfigFor(...) please use keysPathesToInclude or keysPathesToExclude, `
  }
  // if (checkInclude) {
  //   console.log('check include', keysPathesToExclude)
  // }

  // if (checkExclude) {
  //   console.log('check exclude', keysPathesToExclude)
  // }

  let fields: FormlyFieldConfig[] = [];


  function inputToPush(key: string, type: FormlyInputType, model: string, targetChild?: Function) {
    // console.log(`key(${key}) type: ${type} | model: ${model} targetChild: ${targetChild && targetChild.name}`)
    let res: FormlyFieldConfig;
    if (type === 'repeat') {
      const fieldGroup = getFromlyConfigFor(targetChild,
        {
          formType, keysPathesToInclude, keysPathesToExclude,
          relativePath: `${relativePath}.${key}`,
          level: (level + 1), maxLevel
        })
      if (fieldGroup.length > 0) {
        res = {
          key,
          type,
          defaultValue: [],
          fieldArray: {
            fieldGroupClassName: 'row',
            templateOptions: {
              label: `Add new ${_.startCase(key)}`
            },
            fieldGroup
          }
        }
      }

    } else if (type === 'group') {
      const fieldGroup = getFromlyConfigFor(targetChild,
        {
          formType, keysPathesToInclude, keysPathesToExclude, parentModel: model,
          relativePath: `${relativePath}.${key}`,
          level: (level + 1), maxLevel
        })
      if (fieldGroup.length > 0) {
        res = {
          fieldGroupClassName: 'row',
          templateOptions: {
            label: `${_.startCase(key)}`
          },
          wrappers: ['groupwrap'],
          fieldGroup
        }
      }
    } else {
      res = {
        key,
        model,
        type,
        defaultValue: !_.isUndefined(target.prototype[key]) ? target.prototype[key] : undefined,
        templateOptions: {
          label: _.isString(model) ? `${model.split('.').map(l => _.startCase(l)).join(' / ')} / ${_.startCase(key)}`
            : _.startCase(key)
        }
      }
    }
    if (res) {
      Object.keys(res).forEach(key => res[key] === undefined ? delete res[key] : '');
    }
    return res;
  }

  function isAlowedPath(key: string) {
    let isAlowed = true;
    const matchPath = relativePath === '' ? key : `${relativePath}:${key}`
    if (checkExclude) {
      if (keysPathesToExclude.includes(matchPath)) {
        // console.log(`Not allowed key: ${key}`)
        isAlowed = false;
      } else {
        isAlowed = true;
      }
    } else if (checkInclude) {
      if (keysPathesToInclude.includes(matchPath)) {
        // console.log(`Allowed key: ${key}`)
        isAlowed = true;
      } else {
        isAlowed = false;
      }
    }
    // console.log(`Is allowed;${matchPath} `, isAlowed)
    return isAlowed;
  }

  const simpleResolved = []

  function resolveSimpleTypes() {

    for (const key in target.prototype) {
      if (target.prototype.hasOwnProperty(key) && !_.isFunction(target.prototype[key])) {

        if (!isAlowedPath(key)) {
          continue;
        }

        if (!_.isUndefined(mapping[key])) {
          continue;
        }

        const element = target.prototype[key];
        let type: FormlyInputType = 'input';
        if (_.isBoolean(element)) {
          type = 'switch'
        } else if (_.isDate(element)) {
          type = 'datepicker'
        }
        fields.push(inputToPush(key, type, parentModel))
        simpleResolved.push(key)
      }
    }
  }

  function resolveComplexTypes() {

    fieldNames
      .filter(key => !simpleResolved.includes(key))
      .forEach(key => {

        if (isAlowedPath(key) && !_.isUndefined(mapping[key])) {
          let className = mapping[key]
          const isArray = _.isArray(className)
          className = isArray ? _.first(className) : className;

          if (className === 'Date') {
            fields.push(inputToPush(key, 'datepicker', parentModel))
          } else {
            const targetChild = Helpers.Class.getBy(className);

            if (targetChild) {
              if (isArray) {
                fields = fields.concat(inputToPush(key, 'repeat', key, targetChild))
              } else {
                fields = fields.concat(inputToPush(key, 'group', key, targetChild))
              }
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
  return fields.filter(f => !!f);
}


export type FormlyArrayTransformFn =
  (fieldsArray: FormlyFieldConfig[],
    fieldObject?: { [propKey: string]: FormlyFieldConfig })
    => FormlyFieldConfig[]



