import * as _ from 'lodash';
import { Repository, Connection, getRepository } from 'typeorm';
import { ModelDataConfig } from './model-data-config';
import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers';
import type { IBASE_ENTITY } from '../framework/framework-entity';
import { SYMBOL } from '../symbols';

export namespace CrudHelpers {

  export async function getModels(config: ModelDataConfig, repo: any) {
    const obj = {
      where: config && config.db && config.db.where,
      join: config && config.db && config.db.join,
      skip: config && config.db && config.db.skip,
      take: config && config.db && config.db.take
    };
    const toDelete = [];
    Object.keys(obj).forEach(key => {
      if (_.isNil(obj[key])) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => {
      delete obj[key];
    });

    let res = await repo.find(obj);
    return res;
  }

  export async function getModel(id: number | string, config: ModelDataConfig, repo: any) {
    if (!repo) {
      return void 0;
    }
    let res = await repo.findOne({
      where: _.merge({ id }, config && config.db && config.db.where),
      join: config && config.db && config.db.join
    })
    return res;
  }

  export function prepareData(data: IBASE_ENTITY | IBASE_ENTITY[], config: ModelDataConfig, id?: number | string) {
    if (data === void 0) {
      return;
    }
    preventUndefinedModel(data, config, id);
    if (_.isObject(config)) {
      if (!(config instanceof ModelDataConfig)) {
        console.error(`Config not instance of ModelDataConfig`)
        return
      }
      if (_.isArray(data)) {
        data.forEach(d => d['modelDataConfig'] = config)
      } else if (_.isObject(data)) {
        data['modelDataConfig'] = config;
      }
    }
  }

  export function preventUndefinedModel(model, config, id) {
    if (_.isUndefined(model)) {
      console.error(config)
      throw `Bad update by id, config, id: ${id}`
    }
  }

  export function forObjectPropertiesOf(item) {
    return {
      async run(action: (r: Repository<any>, partialItem: Object, entityClass?: Function, ) => Promise<any>) {
        const objectPropertiesToUpdate = [];
        Object.keys(item).forEach(propertyName => {
          const partialItem = item[propertyName];
          if (_.isObject(partialItem) && !_.isArray(partialItem)) {
            const entityClass = CLASS.getFromObject(partialItem);
            const repo = entityClass && entityClass[SYMBOL.HAS_TABLE_IN_DB] && getRepository(entityClass);
            if (repo) {
              objectPropertiesToUpdate.push(action(repo, partialItem, entityClass))
            }
          }
        })
        return Promise.all(objectPropertiesToUpdate);
      }
    }
  }


}
