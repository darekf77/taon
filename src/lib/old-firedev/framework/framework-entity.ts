import { _ } from 'tnp-core/src';
import { Log, Level } from 'ng2-logger/src';
import { SYMBOL } from '../symbols';
import { classNameVlidation } from './framework-helpers';
import { Mapping, Models } from 'ng2-rest/src';

//#region @websql
import {
  Entity as TypeormEntity, Tree
} from 'firedev-typeorm/src';
import { tableNameFrom } from './framework-helpers';
//#endregion
import { CLASS } from 'typescript-class-helpers/src';

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
  // classNameInBrowser?: string;
  defaultModelValues?: Mapping.ModelValue<T>;
  defaultModelMapping?: Mapping.Mapping<T>;
  /**
   * default unique property is "id"
   * for your entity it may be something else
   */
  uniqueKeyProp?: (keyof T);
  // classFamily?: string,
  defaultModelMappingDeep?: { [lodashPathes: string]: string | [string]; }
  // tree?: 'closure-table';
  // formly?: {
  //   transformFn?: FormlyArrayTransformFn;
  //   include?: (keyof T)[];
  //   exclude?: (keyof T)[];
  // },
  //#region @websql
  createTable?: boolean;
  // browserTransformFn?: (entity: T, mdc?: any) => void
  //#endregion
}) {
  // if (!options) {
  //   options = { formly: {} };
  // }
  // if (!options.formly) {
  //   options.formly = {}
  // }
  let {
    defaultModelValues,
    // tree,
    defaultModelMapping,
    defaultModelMappingDeep = {},
    uniqueKeyProp = 'id',
    // classFamily,
    className,
    // classNameInBrowser,
    // formly: {
    //   transformFn = undefined,
    //   include = undefined,
    //   exclude = undefined
    // } = {},
    //#region @websql
    // browserTransformFn,
    createTable = true,
    //#endregion
  } = options;
  return function (target: any) {

    // console.log(`classname for ${className}`)
    className = classNameVlidation(className, target);

    CLASS.NAME(className, {
      uniqueKey: uniqueKeyProp,
      // classFamily,
      // classNameInBrowser
    } as any)(target)
    Mapping.DefaultModelWithMapping<T>(defaultModelValues, _.merge(defaultModelMapping, defaultModelMappingDeep))(target)

    // TODO when entit metadata generator read use this
    Mapping.DefaultModelWithMapping<T>(void 0, {})(target)

    //#region @websql
    // if (_.isFunction(browserTransformFn)) {
    //   const config = CLASS.getConfig(target);
    //   config.browserTransformFn = browserTransformFn;
    //   // console.log('BROWSER TRANSFORM FUNCTION ADDED TO CONFIGS', configs)
    // }

    if (createTable) {
      // console.log(`CREATE TABLE FOR`, target);
      TypeormEntity(tableNameFrom(target))(target)
    }
    target[SYMBOL.HAS_TABLE_IN_DB] = createTable;

    // if (_.isString(tree)) {
    //   Tree("closure-table")(target)
    // }
    //#endregion
  }

}

export abstract class BASE_ENTITY<T = any> {

  /**
   * reserver property for uniq identifier
   * Note: if id is not uniq.. maybe create getter for id ?
   */
  abstract id?: number | string;
  /**
   * here will be injected Firedev controller instance for entity
   * for easy creation of intuitive api
   */
  public ctrl?: any;
  /**
   * here will be injected Firedev controller instance for entity
   * for easy creation of intuitive api
   */
  public static ctrl?: any;
}
