//#region @websql
import { DataSource, Repository } from "firedev-typeorm/src";
//#endregion
import { EndpointContext } from "../endpoint-context";
import { Symbols } from "../symbols";
import { BaseClass } from "./base-class";
import { Helpers } from "tnp-core/src";
import { _ } from "tnp-core/src";
import { ClassHelpers } from "../helpers/class-helpers";
import { Validators } from "../validators";
import { MySqlQuerySource } from "firedev-type-sql/src";

const INDEX_KEYS_NO_FOR_UPDATE = [
  'id',
];

export class BaseRepository<Entity extends { id?: any }> extends BaseClass {
  public entity: any;
  private __dbQuery: MySqlQuerySource;

  protected get dbQuery(): MySqlQuerySource {
    if (!this.__dbQuery) {
      if (!this.__endpoint_context__) {
        throw new Error(`[BaseRepository] Context not inited for class ${ClassHelpers.getName(this)}`);
      }
      const connection = this.__endpoint_context__?.connection;
      if (!connection) {
        throw new Error(`[BaseRepository] Database not inited for context ${this.__endpoint_context__?.contextName}`);
      }
      this.__dbQuery = new MySqlQuerySource(connection);
    }
    return this.__dbQuery;
  }

  public get connection()
    //#region @websql
    : DataSource
  //#endregion
  {
    //#region @websqlFunc
    return this.__endpoint_context__.connection;
    //#endregion
  }


  //#region repository
  //#region @websql
  public get repository(): Repository<Entity> {
    const ctx = this.__endpoint_context__;
    const connection = this.connection;
    if (ctx && !connection) {
      throw new Error(`Database not inited for context ${ctx.contextName}`);
    }
    return connection?.getRepository(this.entity as any);
  }
  /**
   * aliast to repository
   */
  public get repo() {
    return this.repository;
  }
  //#endregion
  //#endregion

  _() {
    //#region @websql
    // if (!this.entityClassFn) {
    //   Helpers.error(`Entity class not provided for repository ${ClassHelpers.getName(this)}.

    //   Please provide entity as class property entityClassFn:

    //   class ${ClassHelpers.getName(this)} extends BaseRepository<Entity> {
    //     // ...
    //     entityClassFn = MyEntityClass;
    //     // ...
    //   }

    //   `);
    // }
    //#endregion
  }

  async getAll() {
    //#region @websqlFunc
    const totalCount = await this.repo.count();
    const models = await this.repo.find();
    this.prepareData(models)
    return { models, totalCount };
    //#endregion
  }

  async getBy(id: number | string) {
    //#region @websqlFunc
    const model = await await this.repo.findOne({
      where: { id } as any
    });

    this.prepareData(model, id);
    return { model };
    //#endregion
  }

  async update(item: Entity) {
    //#region @websqlFunc
    const { id } = item as any;
    return await this.updateById(id, item);
    //#endregion
  }

  async updateById(id: number | string, item: Entity) {
    //#region @websqlFunc
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
    let model = await this.repo.findOne({
      where: { id } as any
    });

    this.prepareData(model, id);
    return { model };
    //#endregion
  }

  async bulkUpdate(items: Entity[]) {
    //#region @websqlFunc
    const models = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const { id } = item as any; // TOOD
      const { model } = await this.updateById(id, item);
      models.push(model);
    }
    return { models };
    //#endregion
  }

  async deleteById(id: number | string) {
    //#region @websqlFunc
    const deletedEntity = await this.repo.findOne({
      where: { id } as any
    });

    const idCopy = deletedEntity.id;
    await this.repo.remove(deletedEntity);
    this.prepareData(deletedEntity, id);
    deletedEntity.id = idCopy;
    return { model: deletedEntity };
    //#endregion
  }

  async bulkDelete(ids: (number | string)[]) {
    //#region @websqlFunc
    const models = [];
    for (let index = 0; index < ids.length; index++) {
      const id = ids[index];
      const { model } = await this.deleteById(id);
      models.push(model);
    }
    return { models };
    //#endregion
  }

  async create(item: Entity) {
    //#region @websqlFunc

    let model = await this.repo.create(item)

    model = await this.repo.save(model);
    const { id } = model as any;

    model = await this.repo.findOne({
      where: { id } as any
    });

    this.prepareData(model as any, id);
    return { model };
    //#endregion
  }

  async bulkCreate(items: Entity[]) {
    //#region @websqlFunc
    const models = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const { model } = await this.create(item);
      models.push(model);
    }
    return { models };
    //#endregion
  }

  private prepareData(data: any | any[], id?: number | string) {
    //#region @websqlFunc
    if (data === void 0) {
      return;
    }
    Validators.preventUndefinedModel(data, id);
    //#endregion
  }

}
