//#region imports
import { Symbols } from "../symbols";
import { BaseController } from "./base-controller";
import { BaseRepository } from "./base-repository";
import { GET, PUT, DELETE, POST, HEAD, PATCH } from '../decorators/http/http-methods-decorators';
import { Query, Path, Body } from '../decorators/http/http-params-decorators';
import { MySqlQuerySource } from 'firedev-type-sql/src';
import { Models } from '../models';
import { Helpers, _ } from 'tnp-core/src';
import { FiredevController, FiredevControllerOptions } from '../decorators/classes/controller-decorator';
import { ClassHelpers } from "../helpers/class-helpers";
import { Entity } from "firedev-typeorm/lib";
import { Validators } from "../validators";
import { FiredevEntityOptions } from "../decorators/classes/entity-decorator";
//#endregion

/**
 * Please override property entityClassFn with entity class.
 */
@FiredevController({ className: 'BaseCrudController' })
export abstract class BaseCrudController<Entity> extends BaseController {

  //#region fields
  crud?: BaseRepository<Entity> = this.inject(BaseRepository<Entity>);
  /**
   * alias for repository
   */
  get repo() {
    //#region @websqlFunc
    return this.crud?.repo;
    //#endregion
  }
  get repository() {
    //#region @websqlFunc
    return this.crud?.repo;
    //#endregion
  }

  get connection() {
    //#region @websqlFunc
    return this.crud?.connection;
    //#endregion
  }

  get dbQuery() {
    //#region @websqlFunc
    return this.crud?.dbQuery;
    //#endregion
  }


  /**
   * Please provide entity as class propery entityClassFn:
   */
  abstract entity();
  //#endregion

  //#region init
  async _() {
    const entityClassFn = this.entity();
    if (entityClassFn) {
      const configEntity = Reflect.getMetadata(Symbols.metadata.options.entity, ClassHelpers.getClassFnFromObject(this)) as FiredevEntityOptions;
      if (configEntity?.createTable === false) {
        Helpers.warn(`Table for entity ${ClassHelpers.getName(entityClassFn)} will not be created. Crud will not work properly.`);
      }
      this.crud.entity = entityClassFn;
    } else {
      Helpers.error(`Entity class not provided for controller ${ClassHelpers.getName(this)}.

      Please provide entity as class propery entityClassFn:

      class ${ClassHelpers.getName(this)} extends BaseCrudController<Entity> {
        // ...
        entityClassFn = MyEntityClass;
        // ...
      }

      `);
    }

  }
  //#endregion

  //#region bufferd changes
  @GET(`/${Symbols.old.CRUD_TABLE_MODEL}/:id/property/:property`)
  bufforedChanges(
    @Path(`id`) id: number | string,
    @Path(`property`) property: string,
    @Query('alreadyLength') alreadyLength?: number
  ): Models.Http.Response<string | any[]> {
    //#region @websqlFunc
    return async (request, response) => {

      const model = await this.crud.repo.findOne({
        where: { id } as any
      })
      if (model === void 0) {
        return;
      }
      Validators.preventUndefinedModel(model, id)
      let value = model[property];
      let result: any;
      if (_.isString(value) || _.isArray(value)) {
        result = (value as string).slice(alreadyLength);
      }

      return result;
    }
    //#endregion
  }
  //#endregion

  //#region pagintation
  @GET(`/${Symbols.old.CRUD_TABLE_MODELS}-pagination`)
  pagination(
    @Query('pageNumber') pageNumber: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('search') search: string = '',
  ): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async (request, response) => {
      if (this.crud.repository) {

        const query = {
          page: pageNumber,
          take: pageSize,
          keyword: search,
        };
        // console.log({
        //   query
        // })

        const take = query.take || 10
        const page = query.page || 1;
        const skip = (page - 1) * take;
        const keyword = query.keyword || ''

        const [result, total] = await this.crud.repo.findAndCount(
          {
            // where: { name: Like('%' + keyword + '%') },
            // order: { name: "DESC" },
            take: take,
            skip: skip
          }
        );


        response?.setHeader(Symbols.old.X_TOTAL_COUNT, total)
        // const lastPage = Math.ceil(total / take);
        // const nextPage = page + 1 > lastPage ? null : page + 1;
        // const prevPage = page - 1 < 1 ? null : page - 1;

        // console.log({
        //   result,
        //   total
        // })

        return result as Entity[];
      }
      return []
    }
    //#endregion
  }
  //#endregion

  //#region get all
  @GET(`/${Symbols.old.CRUD_TABLE_MODELS}`)
  getAll(): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async (request, response) => {
      if (this.crud.repository) {
        const { models, totalCount } = await this.crud.getAll();
        response?.setHeader(Symbols.old.X_TOTAL_COUNT, totalCount)
        return models;
      }
      return [];
    }
    //#endregion
  }
  //#endregion

  //#region get by id
  @GET(`/${Symbols.old.CRUD_TABLE_MODEL}/:id`)
  getBy(@Path(`id`) id: number | string): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const { model } = await this.crud.getBy(id);
      return model;
    }
    //#endregion
  }
  //#endregion

  //#region update by id
  @PUT(`/${Symbols.old.CRUD_TABLE_MODEL}/:id`)
  updateById(@Path(`id`) id: number | string, @Body() item: Entity): Models.Http.Response<Entity> {
    //#region @websqlFunc

    return async () => {
      const { model } = await this.crud.updateById(id, item as any);
      return model;

    }
    //#endregion
  }
  //#endregion

  //#region bulk update
  @PUT(`/bulk/${Symbols.old.CRUD_TABLE_MODELS}`)
  bulkUpdate(@Body() items: Entity[]): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async () => {
      if (!Array.isArray(items) || (items?.length === 0)) {
        return [];
      }
      const { models } = await this.crud.bulkUpdate(items);
      return models;
    }
    //#endregion
  }
  //#endregion

  //#region delete by id
  @DELETE(`/${Symbols.old.CRUD_TABLE_MODEL}/:id`)
  deleteById(@Path(`id`) id: number): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const { model } = await this.crud.deleteById(id);
      return model;
    }
    //#endregion
  }
  //#endregion

  //#region bulk delete
  @DELETE(`/bulk/${Symbols.old.CRUD_TABLE_MODELS}/:ids`)
  bulkDelete(@Path(`ids`) ids: (number | string)[]): Models.Http.Response<(number | string | Entity)[]> {
    //#region @websqlFunc
    return async () => {
      const { models } = await this.crud.bulkDelete(ids);
      return models;
    }
    //#endregion
  }
  //#endregion

  //#region create
  @POST(`/${Symbols.old.CRUD_TABLE_MODEL}/`)
  create(@Body() item: Entity): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const { model } = await this.crud.create(item as any);
      return model as Entity;
    }
    //#endregion
  }
  //#endregion

  //#region bulk create
  @POST(`/bulk/${Symbols.old.CRUD_TABLE_MODELS}/`)
  bulkCreate(@Body() items: Entity): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async () => {
      const { models } = await this.crud.bulkCreate(items as any);
      return models as Entity[];
    }
    //#endregion
  }
  //#endregion

}
