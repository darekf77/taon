//#region @websql
import * as _ from 'lodash';
import { Repository, Connection, getRepository } from 'typeorm';
import { CLASS } from 'typescript-class-helpers';
import type { IBASE_ENTITY } from '../framework/framework-entity';
import { SYMBOL } from '../symbols';

export namespace CrudHelpers {

  export async function getModels(repo: any) {
    if (!repo) {
      return void 0;
    }
    let results = await repo.find();
    return results;
  }

  export async function getModel(id: number | string, repo: any) {
    if (!repo) {
      return void 0;
    }
    let res = await repo.findOne({
      where: { id }
    })
    return res;
  }

  export function prepareData(data: IBASE_ENTITY | IBASE_ENTITY[], id?: number | string) {
    if (data === void 0) {
      return;
    }
    preventUndefinedModel(data, id);
  }

  export function preventUndefinedModel(model, id) {
    if (_.isUndefined(model)) {
      throw `Bad update by id, config, id: ${id}`
    }
  }

  export function forObjectPropertiesOf(item) {
    return {
      async run(action: (r: Repository<any>, partialItem: Object, entityClass?: Function,) => Promise<any>) {
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
//#endregion
