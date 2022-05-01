import * as _ from 'lodash';
import { Repository, Connection, getRepository } from 'typeorm';
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

  async getAll() {
    const totalCount = await this.repo.count();
    const models = await CrudHelpers.getModels(this.repo);
    CrudHelpers.prepareData(models)
    return { models, totalCount };
  }

  async getBy(id: number | string) {
    const model = await CrudHelpers.getModel(id, this.repo);
    CrudHelpers.prepareData(model, id);
    return { model };
  }

  async update(item: T) {
    const { id } = item as any;
    return await this.updateById(id, item);
  }

  async updateById(id: number | string, item: T) {
    const allowedPropsToUpdate = [];
    for (const key in item) {
      if (
        item.hasOwnProperty(key)
        && typeof item[key] !== 'object'
        && !_.isUndefined(this.repo.metadata.ownColumns.find(c => c.propertyName === key))
      ) {
        allowedPropsToUpdate.push(key);
      }
    }

    for (let i = 0; i < allowedPropsToUpdate.length; i++) {
      const key = allowedPropsToUpdate[i];
      const raw = _.isBoolean(item[key]) || _.isNumber(item[key]) || _.isNull(item[key]); // TODO does this make any sense ?
      const toSet = raw ? item[key] : `"${item[key]}"`
      await this.repo.query(`UPDATE "${tableNameFrom(this.entity as any)}" `
        + `SET "${key}"=${toSet} WHERE "id"="${id}"`)
    }
    // console.log('update ok!')
    let model = await CrudHelpers.getModel(id, this.repo);

    CrudHelpers.prepareData(model, id);
    return { model };
  }

  async bulkUpdate(items: T[]) {
    const models = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const { id } = item as any; // TOOD
      const { model } = await this.updateById(id, item);
      models.push(model);
    }
    return { models };
  }

  async deleteById(id: number | string) {
    const deletedEntity = await CrudHelpers.getModel(id, this.repo);
    await this.repo.remove(deletedEntity);
    CrudHelpers.prepareData(deletedEntity, id);
    return { model: deletedEntity };
  }

  async bulkDelete(ids: (number | string)[]) {
    const models = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      await this.deleteById(id);
    }
    return { models };
  }

  async create(item: T) {
    // @ts-ignore
    let model = await this.repo.create(item)
    // @ts-ignore
    model = await this.repo.save(model);
    const { id } = model as any;

    model = await CrudHelpers.getModel(id, this.repo);

    CrudHelpers.prepareData(model as any, id);
    return { model };
  }

  async bulkCreate(items: T[]) {
    const models = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const { model } = await this.create(item);
      models.push(model);
    }
    return { models };
  }

}

