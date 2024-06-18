//#region @websql
import { DataSource, Repository } from 'firedev-typeorm/src';
//#endregion
import type { DataSource as DataSourceType } from 'firedev-typeorm/src';
import { EndpointContext } from '../endpoint-context';
import { Symbols } from '../symbols';
import { BaseClass } from './base-class';
import { Helpers } from 'tnp-core/src';
import { _ } from 'tnp-core/src';
import { ClassHelpers } from '../helpers/class-helpers';
import { Validators } from '../validators';
import { MySqlQuerySource } from 'firedev-type-sql/src';
import type { BaseEntity } from 'firedev/src';
import { FiredevRepository } from '../decorators/classes/repository-decorator';

const INDEX_KEYS_NO_FOR_UPDATE = ['id'];

@FiredevRepository({ className: 'BaseRepository' })
export class BaseRepository<Entity extends { id?: any }> extends BaseClass {
  // static ids:number  = 0;
  // id:number  = BaseRepository.ids++;

  //#region entity class resovle fn
  __entityClassResolveFn: () => any;
  get entityClassResolveFn() {
    // console.log(`ACCESSING entityClassResolveFn entity for repo "${ClassHelpers.getName(this)}"`);
    if (!_.isFunction(this.__entityClassResolveFn)) {
      throw new Error(`Entity class not provided for repository "${ClassHelpers.getName(
        this,
      )}".
      Please fix it by adding entityClassResolveFn property to class like this:
        ...
        entityClassResolveFn = () => YourEntityClass;
        ..
          `);
    }
    return this.__entityClassResolveFn;
  }

  set entityClassResolveFn(fn: () => any) {
    // console.log(`SETTING entityClassResolveFn with entity "${ClassHelpers.getName(fn())}" for repo "${ClassHelpers.getName(this)}"`);
    this.__entityClassResolveFn = fn;
  }

  //#endregion

  //#region db query
  private __dbQuery: MySqlQuerySource;

  public get dbQuery(): MySqlQuerySource {
    //#region @websqlFunc
    if (!this.__dbQuery) {
      if (!this.__endpoint_context__) {
        throw new Error(
          `[BaseRepository] Context not inited for class ${ClassHelpers.getName(
            this,
          )}`,
        );
      }
      const connection = this.__endpoint_context__?.connection;
      if (!connection) {
        throw new Error(
          `[BaseRepository] Database not inited for context ${this.__endpoint_context__?.contextName}`,
        );
      }
      this.__dbQuery = new MySqlQuerySource(connection);
    }
    return this.__dbQuery;
    //#endregion
  }
  //#endregion

  //#region connection
  public get connection(): DataSourceType {
    //#region @websqlFunc
    return this.__endpoint_context__.connection;
    //#endregion
  }
  //#endregion

  //#region repository
  //#region @websql
  public __repository: Repository<Entity>;
  public get repository() {
    return this.__repository;
  }

  /**
   * aliast to repository
   */
  public get repo() {
    return this.repository;
  }
  //#endregion
  //#endregion

  async __init_repository__() {
    //#region @websql
    let entityClassFn: any = this.entityClassResolveFn();
    const ctx: EndpointContext = this.__endpoint_context__;
    const connection = ctx.connection;

    if (!connection) {
      throw new Error(`Connection not found for context ${ctx.contextName}`);
    }

    entityClassFn = this.__endpoint_context__.getClassFunByClass(entityClassFn);

    if (!entityClassFn) {
      Helpers.warn(
        `Entity class not found for repository ${ClassHelpers.getName(this)}`,
      );
      return;
    }

    const entityObj = entityClassFn[Symbols.orignalClassClonesObj];
    if (!entityObj) {
      console.error(
        `Cannot init base repository for ` +
          ` ${ctx.contextName}/${ClassHelpers.getName(this)}/${
            entityClassFn[Symbols.fullClassNameStaticProperty]
          }`,
      );
      return;
    }
    entityClassFn = entityObj[ctx.contextName];

    // console.log(
    //   `Trying to init repo for ${ctx.contextName}/` +
    //     `${ClassHelpers.getName(this)}/` +
    //     `${entityClassFn[Symbols.fullClassNameStaticProperty]}`,
    // );

    this.__repository = (await connection.getRepository(entityClassFn)) as any;
    // console.log(
    //   `Inited repository for (${ClassHelpers.getFullInternalName(this)}) ` +
    //     ` ${ctx.contextName}/${ClassHelpers.getName(this)}/${
    //       entityClassFn[Symbols.fullClassNameStaticProperty]
    //     }`,
    //   this.repository,
    // );
    //#endregion
  }

  async getAll() {
    //#region @websqlFunc
    const totalCount = await this.repo.count();
    const models = await this.repo.find();
    this.prepareData(models);
    return { models, totalCount };
    //#endregion
  }

  async getBy(id: number | string) {
    //#region @websqlFunc
    const model = await await this.repo.findOne({
      where: { id } as any,
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
        _.isObject(item) &&
        item.hasOwnProperty(key) &&
        typeof item[key] !== 'object' &&
        !_.isUndefined(
          this.repo.metadata.ownColumns.find(c => c.propertyName === key),
        )
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

        await this.repo.update(
          {
            id,
          } as any,
          {
            [key]: toSet,
          } as any,
        );
        //         await this.repo.query(
        //           `UPDATE '${tableName}' as ${table}
        // SET ${key}=${toSet}
        // WHERE ${table}.id='${id}'
        // `);
      }
    }
    let model = await this.repo.findOne({
      where: { id } as any,
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
      where: { id } as any,
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

    let model = await this.repo.create(item);

    model = await this.repo.save(model);
    const { id } = model as any;

    model = await this.repo.findOne({
      where: { id } as any,
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
