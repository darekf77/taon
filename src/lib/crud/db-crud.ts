//#region @websql
import * as _ from 'lodash';
import { Repository, Connection } from 'firedev-typeorm';
import { CrudHelpers } from './crud-helpers';

const INDEX_KEYS_NO_FOR_UPDATE = [
  'id',
];

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
        _.isObject(item) && item.hasOwnProperty(key)
        && typeof item[key] !== 'object'
        && !_.isUndefined(this.repo.metadata.ownColumns.find(c => c.propertyName === key))
      ) {
        allowedPropsToUpdate.push(key);
      }
    }



    for (let i = 0; i < allowedPropsToUpdate.length; i++) {
      const key: string = allowedPropsToUpdate[i];
      if (!INDEX_KEYS_NO_FOR_UPDATE.includes(key.toLowerCase())) {
        // const raw = _.isBoolean(item[key]) || _.isNumber(item[key]) || _.isNull(item[key]); // TODO does this make any sense ?
        const toSet = item[key];
        // const tableName = tableNameFrom(this.entity as any);
        // const table = CLASS.getName(this.entity);
        await this.repo.update({
          id
        } as any, {
          [key]: toSet
        } as any);
        //         await this.repo.query(
        //           `UPDATE '${tableName}' as ${table}
        // SET ${key}=${toSet}
        // WHERE ${table}.id='${id}'
        // `);
      }
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
    const idCopy = deletedEntity.id;
    await this.repo.remove(deletedEntity);
    CrudHelpers.prepareData(deletedEntity, id);
    deletedEntity.id = idCopy;
    return { model: deletedEntity };
  }

  async bulkDelete(ids: (number | string)[]) {
    const models = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const { model } = await this.deleteById(id);
      models.push(model);
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

//#endregion
