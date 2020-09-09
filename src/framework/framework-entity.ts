import * as _ from 'lodash';
import { Log } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { FormlyArrayTransformFn } from '../crud/fromly';
import { classNameVlidation } from './framework-helpers';
import { Mapping, Models } from 'ng2-rest';


//#region @backend
import {
  InsertEvent, UpdateEvent, RemoveEvent,
  Entity as TypeormEntity, Tree
} from 'typeorm';
import { tableNameFrom } from './framework-helpers';
//#endregion
import { RealtimeBrowser } from '../realtime';
import { BaseCRUD, ModelDataConfig } from '../crud'
import { CLASS } from 'typescript-class-helpers';


const log = Log.create('Framework entity')

const updatesInProgress = {};

function getUpdateID(id, entityName, propterty, config) {
  return `${_.kebabCase(id)}-${_.kebabCase(entityName)}-${_.kebabCase(propterty)}-${
    _.isObject(config) ? _.kebabCase(JSON.stringify(config)) : ''
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


    className = classNameVlidation(className, target);

    CLASS.NAME(className, {
      uniqueKey: uniqueKeyProp,
      classFamily,
      classNameInBrowser
    } as any)(target)
    Mapping.DefaultModelWithMapping<T>(defaultModelValues, _.merge(mapping, additionalMapping))(target)

    //#region @backend
    if (_.isFunction(browserTransformFn)) {
      const configs = CLASS.getConfig(target) as any[];
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

export abstract class BASE_ENTITY<T, TRAW = T, CTRL extends BaseCRUD<T> = any> {

  abstract id: number;
  public modelDataConfig?: ModelDataConfig;

  /**
   * injected controller for entity for easy coding
   */
  public ctrl: CTRL;
  public static ctrl: any;

  /**
   * keep backend data here for getters, function etc
   */
  browser: IBASE_ENTITY;

  isListeningToRealtimeChanges(property?: (keyof T)) {
    if (_.isString(property)) {
      return !!getRealtimeIsRealtime(this, property)
    } else {
      return !!this[IS_RELATIME];
    }

  }

  unsubscribeRealtimeUpdatesOfProperties() {
    if (_.isObject(this[IS_RELATIME_PROPERTY])) {
      Object.keys(this[IS_RELATIME_PROPERTY]).forEach(property => {
        this.unsubscribeRealtimeUpdates(property as any)
      })
    }
  }
  unsubscribeRealtimeUpdates(property?: (keyof T) | (keyof T)[]) {
    if (_.isArray(property)) {
      property.forEach(p => {
        this.unsubscribeRealtimeUpdates(p)
      })
      return;
    }
    if (_.isString(property)) {
      RealtimeBrowser.UnsubscribeEntityPropertyChanges(this, property)
      this[IS_RELATIME_PROPERTY][property] = void 0;
    } else {
      this[IS_RELATIME] = false;
      RealtimeBrowser.UnsubscribeEntityChanges(this);
    }
  }

  subscribeRealtimeUpdates<CALLBACK = T>(options: {
    modelDataConfig?: ModelDataConfig,
    /**
     * Only listen realtime update when condition function  true
     */
    afterMergeCallback?: (updatedData: T) => any,
    /**
     * Listen for realtime listening
     */
    property?: (keyof T),
    /**
     * Only for listening and autoupdate of buffored property changes
     * Perfect for logs
     */
    bufforProperty?: (keyof T);
    /**
     * Custom update function to get new value of entity of entity property
     */
    update?: (any?) => Promise<Models.HttpResponse<CALLBACK>>
    /**
     * Trigers when realtime update new data.
     * This function helpse merging new entity changes.
     */
    callback?: (response: Models.HttpResponse<CALLBACK>) => CALLBACK | void
  } = {} as any) {
    let { modelDataConfig, callback, afterMergeCallback, property, update, bufforProperty } = options;
    const that = this;

    if (!_.isObject(this[IS_RELATIME_PROPERTY])) {
      this[IS_RELATIME_PROPERTY] = {};
    }


    const changesListener = (entityToUpdate: BASE_ENTITY<any>) => {
      return async () => {

        if (_.isString(bufforProperty)) {
          let alreadyLength = 0;
          if (!_.isUndefined(that[bufforProperty as any]) &&
            (_.isString(that[bufforProperty as any]) || _.isArray(that[bufforProperty as any]))) {
            alreadyLength = (that[bufforProperty as any] as any[]).length;
          }
          update = () => that.ctrl.bufforedChanges(that.id, property as any, alreadyLength, modelDataConfig).received as any
        }

        if (_.isUndefined(update) && that.ctrl) {
          update = () => that.ctrl.getBy(that.id, modelDataConfig).received as any;
        }
        const updateID = getUpdateID(that.id, CLASS.getNameFromObject(that), property, modelDataConfig);

        if (updatesInProgress[updateID]) {
          // console.log(`ANOTHER UPDATE IN PROGRESS FOR UPDATEID: "${updateID}"`)
          return
        }
        updatesInProgress[updateID] = true;
        // console.log('entity should be updated !')
        const data = update ? (await update()) : { body: { json: entityToUpdate } };
        let newData = data.body.json;
        if (_.isFunction(callback)) {
          const newDataCallaback = callback(data as any)
          if (!_.isUndefined(newDataCallaback)) {
            newData = newDataCallaback as any;
          }
        }
        const newDataType: 'array' | 'string' = _.isArray(newData) ? 'array' : (_.isString(newData) ? 'string' : void 0);
        if (_.isString(bufforProperty) && !newDataType) {
          console.warn(data);
          console.warn('New data type is not string or array', newData)
        }
        if (_.isString(property)) {
          if (_.isString(bufforProperty)) {

            if (_.isNil(entityToUpdate[bufforProperty as any])) {
              entityToUpdate[bufforProperty as any] = ((newDataType === 'array') ? [] : '');
            }
            entityToUpdate[bufforProperty as any] = entityToUpdate[bufforProperty as any].concat(newData as any);

          } else {
            entityToUpdate[property as string] = newData;
          }
        } else {
          mergeWhatImportant(entityToUpdate, newData);
          // _.merge(entityToUpdate, newData);
        }

        if (_.isFunction(afterMergeCallback)) {
          afterMergeCallback(entityToUpdate as any);
        }
        updatesInProgress[updateID] = false;
      }
    }


    if (this.isListeningToRealtimeChanges(property)) {
      console.warn(`Alread listen to this ${
        _.isString(property) ? ('property: ' + property + ' of entity: ' + CLASS.getNameFromObject(this))
          : ('entity: ' + CLASS.getNameFromObject(this))
        } `, this)
      RealtimeBrowser.addDupicateRealtimeEntityListener(this, changesListener(this), property as any)
      return;
    }
    if (_.isString(property)) {
      this[IS_RELATIME_PROPERTY][property] = true;
      RealtimeBrowser.SubscribeEntityPropertyChanges(this, property, changesListener(this))
    } else {
      this[IS_RELATIME] = true;
      RealtimeBrowser.SubscribeEntityChanges(this, changesListener(this))
    }

    if (_.isString(bufforProperty)) {
      RealtimeBrowser.TriggerChange(this, property as any)
    }
  }

}

function mergeWhatImportant(dest: Object, source: Object) {
  if (_.isObject(source)) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const element = source[key];
        if (!_.isUndefined(element)) {
          dest[key] = source[key]
        }
      }
    }
  }
}
