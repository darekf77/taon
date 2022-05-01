import { _ } from 'tnp-core';
import { Log, Level } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { FormlyArrayTransformFn } from '../crud/fromly';
import { classNameVlidation } from './framework-helpers';
import { Mapping, Models } from 'ng2-rest';

//#region @backend
import {
  Entity as TypeormEntity, Tree
} from 'typeorm';
import { tableNameFrom } from './framework-helpers';
//#endregion
import { RealtimeBrowser } from '../realtime';
import { BaseCRUD, ModelDataConfig } from '../crud'
import { CLASS } from 'typescript-class-helpers';

const log = Log.create('Framework entity',
  Level.__NOTHING
)


function getUpdateID(id, entityName, propterty, config) {
  return `${_.kebabCase(id)}-${_.kebabCase(entityName)}-${_.kebabCase(propterty)}-${_.isObject(config) ? _.kebabCase(JSON.stringify(config)) : ''
    }`
}

export interface IBASE_ENTITY extends BASE_ENTITY<any> {

}

const IS_RELATIME = Symbol()
const IS_RELATIME_PROPERTY = Symbol()

function getRealtimeIsRealtime(entity, property: string) {
  if (!_.isObject(entity[IS_RELATIME_PROPERTY])) {
    entity[IS_RELATIME_PROPERTY] = {};
  }
  return entity[IS_RELATIME_PROPERTY][property]
}

export function Entity<T = {}>(options?: {
  className?: string;
  classNameInBrowser?: string;
  defaultModelValues?: Mapping.ModelValue<T>;
  mapping?: Mapping.Mapping<T>;
  uniqueKeyProp?: (keyof T);
  classFamily?: string,
  additionalMapping?: { [lodashPathes: string]: string | [string]; }
  tree?: 'closure-table';
  formly?: {
    transformFn?: FormlyArrayTransformFn;
    include?: (keyof T)[];
    exclude?: (keyof T)[];
  },
  //#region @backend
  createTable?: boolean;
  browserTransformFn?: (entity: T, mdc?: ModelDataConfig) => void
  //#endregion
}) {
  if (!options) {
    options = { formly: {} };
  }
  if (!options.formly) {
    options.formly = {}
  }
  let {
    defaultModelValues,
    tree,
    mapping,
    additionalMapping = {},
    uniqueKeyProp = 'id',
    classFamily,
    className,
    classNameInBrowser,
    formly: {
      transformFn = undefined,
      include = undefined,
      exclude = undefined
    } = {},
    //#region @backend
    browserTransformFn,
    createTable = true,
    //#endregion
  } = options;
  return function (target: any) {

    // console.log(`classname for ${className}`)
    className = classNameVlidation(className, target);

    CLASS.NAME(className, {
      uniqueKey: uniqueKeyProp,
      classFamily,
      classNameInBrowser
    } as any)(target)
    Mapping.DefaultModelWithMapping<T>(defaultModelValues, _.merge(mapping, additionalMapping))(target)

    //#region @backend
    if (_.isFunction(browserTransformFn)) {
      const config = CLASS.getConfig(target);
      config.browserTransformFn = browserTransformFn;
      // console.log('BROWSER TRANSFORM FUNCTION ADDED TO CONFIGS', configs)
    }

    if (createTable) {
      TypeormEntity(tableNameFrom(target))(target)
    }
    target[SYMBOL.HAS_TABLE_IN_DB] = createTable;

    if (_.isString(tree)) {
      Tree("closure-table")(target)
    }
    //#endregion
  }

}

export abstract class BASE_ENTITY<T = any> {

  abstract id: number | string;
  /**
   * here will be injected Firedev controller instance for entity
   * for easy creation of intuitive api
   */
  public ctrl: any;
  /**
   * here will be injected Firedev controller instance for entity
   * for easy creation of intuitive api
   */
  public static ctrl: any;
}
