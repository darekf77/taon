
import * as _ from 'lodash';
import { Log } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { FormlyArrayTransformFn } from '../crud/fromly';
import { classNameVlidation } from './framework-helpers';
import { Mapping, CLASSNAME, Helpers, Models } from 'ng2-rest';


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

export abstract class BASE_ENTITY<T, TRAW=T, CTRL extends BaseCRUD<T> = any> {

  abstract id: number;
  public modelDataConfig: ModelDataConfig;

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
    condition?: (entity: T) => boolean,
    /**
     * Listen for realtime listening
     */
    property?: (keyof T),
    /**
     * Only for listening and autoupdate of buffored property changes
     * Perfect for logs
     */
    isBufforedProperty?: boolean;
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
    let { modelDataConfig, callback, condition, property, update, isBufforedProperty = false } = options;
    const that = this;

    if (_.isFunction(update)) {
      console.warn('Are you sure ? With option "isBufforedProperty" update property is automaticly assigned.');
    }

    if (isBufforedProperty) {
      let alreadyLength = !!this[property as any] && this[property as any].length;
      if (!_.isNumber(alreadyLength)) {
        alreadyLength = 0;
      }
      update = () => that.ctrl.bufforedChanges(that.id, property as any, alreadyLength, modelDataConfig).received as any
    }

    if (!_.isObject(this[IS_RELATIME_PROPERTY])) {
      this[IS_RELATIME_PROPERTY] = {};
    }

    if (_.isUndefined(update)) {
      update = () => that.ctrl.getBy(that.id, modelDataConfig).received as any;
    }

    const changesListener = (entityToUpdate: BASE_ENTITY<any>) => {
      return async () => {
        // console.log('entity should be updated !')
        const data = await update()
        let newData = data.body.json;
        if (_.isFunction(callback)) {
          const newDataCallaback = callback(data as any)
          if (!_.isUndefined(newDataCallaback)) {
            newData = newDataCallaback as any;
          }
        }
        if (_.isString(property)) {
          entityToUpdate[property as any] = newData as any;
        } else {
          _.merge(entityToUpdate, newData);
        }

        if (_.isFunction(condition)) {
          const listenChanges = condition(entityToUpdate as any)
          if (!listenChanges) {
            this.unsubscribeRealtimeUpdates(property as any)
          }
        }
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
  }

}
