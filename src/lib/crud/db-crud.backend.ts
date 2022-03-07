import * as _ from 'lodash';
import { Repository, Connection, getRepository } from 'typeorm';
import { ModelDataConfig } from './model-data-config';
import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers';
import type { IBASE_ENTITY } from '../framework/framework-entity';
import { CrudHelpers } from './crud-helpers.backend';
import { tableNameFrom } from '../framework/framework-helpers';

export class DbCrud<T> {

  public static from<T = any>(connection: Connection, entityClass: Function) {
    return new DbCrud<T>(connection, entityClass);
  }

  readonly repo: Repository<T>;
  constructor(
    connection: Connection,
    private entity: Function,
  ) {
    this.repo = connection.getRepository(entity);
  }

  async getAll(config?: ModelDataConfig) {
    const totalCount = await this.repo.count();
    const models = await CrudHelpers.getModels(config, this.repo);
    CrudHelpers.prepareData(models, config)
    return { models, totalCount };
  }

  async getBy(id: number | string, config?: ModelDataConfig) {
    const model = await CrudHelpers.getModel(id, config, this.repo);
    CrudHelpers.prepareData(model, config, id);
    return { model };
  }

  async update(item: T, config?: ModelDataConfig) {
    const { id } = item as any;
    return await this.updateById(id, item);
  }

  async updateById(id: number | string, item: T, config?: ModelDataConfig) {
    const allowedPropsToUpdate = [];
    for (const key in item) {
      if (item.hasOwnProperty(key) && typeof item[key] !== 'object') {
        allowedPropsToUpdate.push(key);
      }
    }
    for (let i = 0; i < allowedPropsToUpdate.length; i++) {
      const key = allowedPropsToUpdate[i];
      await this.repo.query(`UPDATE "${tableNameFrom(this.entity as any)}" `
          + `SET "${key}"="${item[key]}" WHERE "id"="${id}"`)
    }
    // console.log('update ok!')
    let model = await CrudHelpers.getModel(id, config, this.repo);

    CrudHelpers.prepareData(model, config, id);
    return { model };
  }

  async bulkUpdate(items: T[], config?: ModelDataConfig) {
    const models = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const { id } = item as any; // TOOD
      const { model } = await this.updateById(id, item, config);
      models.push(model);
    }
    return { models };
  }

  async deleteById(id: number | string, config?: ModelDataConfig) {
    const deletedEntity = await CrudHelpers.getModel(id, config, this.repo);
    await this.repo.remove(deletedEntity);
    CrudHelpers.prepareData(deletedEntity, config, id);
    return { model: deletedEntity };
  }

  async bulkDelete(ids: (number | string)[], config?: ModelDataConfig) {
    const models = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      await this.deleteById(id, config);
    }
    return { models };
  }

  async create(item: T, config?: ModelDataConfig) {
    // @ts-ignore
    let model = await this.repo.create(item)
    // @ts-ignore
    model = await this.repo.save(model);
    const { id } = model as any;

    model = await CrudHelpers.getModel(id, config, this.repo);

    CrudHelpers.prepareData(model as any, config, id);
    return { model };
  }

  async bulkCreate(items: T[], config?: ModelDataConfig) {
    const models = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const { model } = await this.create(item, config);
      models.push(model);
    }
    return { models };
  }

}

