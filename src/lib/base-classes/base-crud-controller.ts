//#region imports
import { Symbols } from '../symbols';
import { BaseController } from './base-controller';
import { BaseRepository } from './base-repository';
import {
  GET,
  PUT,
  DELETE,
  POST,
  HEAD,
  PATCH,
} from '../decorators/http/http-methods-decorators';
import { Query, Path, Body } from '../decorators/http/http-params-decorators';
import { MySqlQuerySource } from 'taon-type-sql/src';
import { Models } from '../models';
import { Helpers, _ } from 'tnp-core/src';
import {
  TaonController,
  TaonControllerOptions,
} from '../decorators/classes/controller-decorator';
import { ClassHelpers } from '../helpers/class-helpers';

import { Validators } from '../validators';
import { TaonEntityOptions } from '../decorators/classes/entity-decorator';
//#endregion

/**
 * Please override property entityClassFn with entity class.
 */
@TaonController({ className: 'BaseCrudController' })
export abstract class BaseCrudController<Entity> extends BaseController {
  //#region fields
  protected db: BaseRepository<Entity>;

  /**
   * Please provide entity as class propery entityClassFn:
   * @returns class function
   *
   */
  abstract entityClassResolveFn: () => any;
  //#endregion

  //#region init
  async _() {
    if (!_.isFunction(this.entityClassResolveFn)) {
      Helpers.warn(
        `Skipping initing CRUD controller ${ClassHelpers.getName(
          this,
        )} because entityClassResolveFn is not provided.`,
      );
      return;
    }

    let entityClassFn = this.entityClassResolveFn();
    this.db = this.injectRepo(entityClassFn);

    if (entityClassFn) {
      const configEntity = Reflect.getMetadata(
        Symbols.metadata.options.entity,
        ClassHelpers.getClassFnFromObject(this),
      ) as TaonEntityOptions;
      if (configEntity?.createTable === false) {
        Helpers.warn(
          `Table for entity ${ClassHelpers.getName(
            entityClassFn,
          )} will not be created. Crud will not work properly.`,
        );
      }
    } else {
      Helpers.error(`Entity class not provided for controller ${ClassHelpers.getName(
        this,
      )}.

      Please provide entity as class propery entityClassFn:

      class ${ClassHelpers.getName(this)} extends BaseCrudController<Entity> {
        // ...
        entityClassResolveFn = ()=> MyEntityClass;
        // ...
      }

      `);
    }
    await super._();
  }
  //#endregion

  //#region bufferd changes
  @GET(`/:id/property/:property`)
  bufforedChanges(
    @Path(`id`) id: number | string,
    @Path(`property`) property: string,
    @Query('alreadyLength') alreadyLength?: number,
  ): Models.Http.Response<string | any[]> {
    //#region @websqlFunc
    return async (request, response) => {
      const model = await this.db.getBy(id);
      if (model === void 0) {
        return;
      }
      Validators.preventUndefinedModel(model, id);
      let value = model[property];
      let result: any;
      if (_.isString(value) || _.isArray(value)) {
        result = (value as string).slice(alreadyLength);
      }

      return result;
    };
    //#endregion
  }
  //#endregion

  //#region pagintation
  @GET()
  pagination(
    @Query('pageNumber') pageNumber: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('search') search: string = '',
  ): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async (request, response) => {
      if (this.db.repositoryExists) {
        const query = {
          page: pageNumber,
          take: pageSize,
          keyword: search,
        };
        // console.log({
        //   query
        // })

        const take = query.take || 10;
        const page = query.page || 1;
        const skip = (page - 1) * take;
        const keyword = query.keyword || '';

        const [result, total] = await this.db.findAndCount({
          // where: { name: Like('%' + keyword + '%') },
          // order: { name: "DESC" },
          take: take,
          skip: skip,
        });

        response?.setHeader(Symbols.old.X_TOTAL_COUNT, total);
        // const lastPage = Math.ceil(total / take);
        // const nextPage = page + 1 > lastPage ? null : page + 1;
        // const prevPage = page - 1 < 1 ? null : page - 1;

        // console.log({
        //   result,
        //   total
        // })

        return result as Entity[];
      }
      return [];
    };
    //#endregion
  }
  //#endregion

  //#region get all
  @GET()
  getAll(): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async (request, response) => {
      if (this.db.repositoryExists) {
        const { models, totalCount } = await this.db.getAll();
        response?.setHeader(Symbols.old.X_TOTAL_COUNT, totalCount);
        return models;
      }
      return [];
    };
    //#endregion
  }
  //#endregion

  //#region get by id
  @GET(`/:id`)
  getBy(@Path(`id`) id: number | string): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.getBy(id);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region update by id
  @PUT(`/:id`)
  updateById(
    @Path(`id`) id: number | string,
    @Body() item: Entity,
  ): Models.Http.Response<Entity> {
    //#region @websqlFunc

    return async () => {
      const model = await this.db.updateById(id, item as any);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region patch by id
  @PATCH(`/:id`)
  patchById(
    @Path(`id`) id: number | string,
    @Body() item: Entity,
  ): Models.Http.Response<Entity> {
    //#region @websqlFunc

    return async () => {
      const model = await this.db.updateById(id, item as any);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region bulk update
  @PUT()
  bulkUpdate(@Body() items: Entity[]): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async () => {
      if (!Array.isArray(items) || items?.length === 0) {
        return [];
      }
      const { models } = await this.db.bulkUpdate(items);
      return models;
    };
    //#endregion
  }
  //#endregion

  //#region delete by id
  @DELETE(`/:id`)
  deleteById(@Path(`id`) id: number): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.deleteById(id);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region bulk delete
  @DELETE(`/bulkDelete/:ids`)
  bulkDelete(
    @Path(`ids`) ids: (number | string)[],
  ): Models.Http.Response<(number | string | Entity)[]> {
    //#region @websqlFunc
    return async () => {
      const models = await this.db.bulkDelete(ids);
      return models;
    };
    //#endregion
  }
  //#endregion

  //#region create
  @POST()
  create(@Body() item: Entity): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.create(item as any);
      return model as Entity;
    };
    //#endregion
  }
  //#endregion

  //#region bulk create
  @POST()
  bulkCreate(@Body() items: Entity): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async () => {
      const models = await this.db.bulkCreate(items as any);
      return models as Entity[];
    };
    //#endregion
  }
  //#endregion
}
