
import * as _ from 'lodash';
import { Log } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { FormlyArrayTransformFn } from '../crud/fromly';
import { classNameVlidation } from './framework-helpers';
import { Mapping, CLASSNAME, Helpers } from 'ng2-rest';


//#region @backend
import {
  InsertEvent, UpdateEvent, RemoveEvent,
  Entity as TypeormEntity, Tree
} from 'typeorm';
import { tableNameFrom } from './framework-helpers';


//#endregion

const log = Log.create('Framework entity')

export interface IBASE_ENTITY extends BASE_ENTITY<any> {

}

export function Entity<T = {}>(options?: {
  className?: string;
  defaultModelValues?: Mapping.ModelValue<T>;
  mapping?: Mapping.Mapping<T>;
  additionalMapping?: { [lodashPathes: string]: string | [string]; }
  tree?: 'closure-table';
  formly?: {
    transformFn?: FormlyArrayTransformFn;
    include?: (keyof T)[];
    exclude?: (keyof T)[];
  },
  //#region @backend
  createTable?: boolean;
  browserTransformFn?: (entity: T) => T
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
    className,
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


    className = classNameVlidation(className, target);

    CLASSNAME.CLASSNAME(className)(target)
    Mapping.DefaultModelWithMapping<T>(defaultModelValues, _.merge(mapping, additionalMapping))(target)

    //#region @backend
    if (_.isFunction(browserTransformFn)) {
      const configs = Helpers.Class.getConfig(target)
      const config = _.first(configs);
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

export abstract class BASE_ENTITY<T, TRAW=T, CTRL = {}> {

  abstract id: number;

  /**
   * injected controller for entity for easy coding
   */
  public ctrl: CTRL;
  public static ctrl: any;

  /**
   * keep backend data here for getters, function etc
   */
  browser: IBASE_ENTITY;


}


