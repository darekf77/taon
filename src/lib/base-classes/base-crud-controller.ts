//#region imports
import { Brackets, RelationPath } from 'taon-typeorm/src';
import { Helpers, _ } from 'tnp-core/src';

import { TaonController } from '../decorators/classes/controller-decorator';
import { TaonEntityOptions } from '../decorators/classes/entity-decorator';
import {
  GET,
  PUT,
  DELETE,
  POST,
  HEAD,
  PATCH,
} from '../decorators/http/http-methods-decorators';
import { Query, Path, Body } from '../decorators/http/http-params-decorators';
import { ClassHelpers } from '../helpers/class-helpers';
import { Models, TaonPaginationQuery } from '../models';
import { Symbols } from '../symbols';
import { Validators } from '../validators';

import { TaonBaseController } from './base-controller';
import { TaonBaseRepository } from './base-repository';
//#endregion

/**
 * Please override property entityClassFn with entity class.
 */
@TaonController({ className: 'TaonBaseCrudController' })
export abstract class TaonBaseCrudController<
  Entity,
  UPLOAD_FILE_QUERY_PARAMS = {},
  ControllerClass = any,
> extends TaonBaseController<UPLOAD_FILE_QUERY_PARAMS> {
  //#region fields
  protected db: TaonBaseRepository<Entity>;

  /**
   * Please provide entity as class property entityClassFn:
   * @returns class function
   *
   */
  abstract entityClassResolveFn: () => any;
  //#endregion

  //#region init
  async _(): Promise<void> {
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

      Please provide entity as class property entityClassFn:

      class ${ClassHelpers.getName(this)} extends TaonBaseCrudController<Entity> {
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
  @GET()
  bufforedChanges(
    @Query(`id`) id: number | string,
    @Query(`property`) property: string,
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

  //#region pagintation query

  @GET()
  paginationQuery(
    @Query() queryJson?: TaonPaginationQuery<ControllerClass>,
  ): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async (request, response) => {
      return this.__executePaginationQuery(queryJson || {}, response);
    };
    //#endregion
  }

  //#endregion

  //#region pagination safe

  @POST()
  paginationQuerySafe(
    @Body() query: TaonPaginationQuery<ControllerClass>,
  ): Models.Http.Response<Entity[]> {
    //#region @websqlFunc
    return async (request, response) => {
      return this.__executePaginationQuery(query ?? {}, response);
    };
    //#endregion
  }

  //#endregion

  protected paginationQueryMethods(): (keyof ControllerClass)[] {
    return [];
  }

  protected async __callPaginationQueryMethod(
    methodName: keyof ControllerClass,
    query: TaonPaginationQuery<ControllerClass>,
  ): Promise<[Entity[], number]> {
    if (!this.paginationQueryMethods().includes(methodName)) {
      throw new Error(
        `Pagination query method "${methodName as any}" is not allowed.`,
      );
    }

    const method = (this as any)[methodName];

    if (typeof method !== 'function') {
      throw new Error(
        `Pagination query method "${methodName as any}" does not exist.`,
      );
    }

    return method.call(this, query);
  }

  protected async __executePaginationQuery(
    query: TaonPaginationQuery<ControllerClass>,
    response: any,
  ): Promise<Entity[]> {
    //#region @websqlFunc
    if (!this.db.repositoryExists) {
      return [];
    }

    const pageNumber = Math.max(1, Number(query.pageNumber) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);

    const normalizedQuery: TaonPaginationQuery<ControllerClass> = {
      ...query,
      pageNumber,
      pageSize,
      search: query.search?.toString()?.trim() ?? '',
      filters: query.filters ?? {},
    };

    let result: Entity[];
    let total: number;

    if (normalizedQuery.callQueryMethod) {
      [result, total] = await this.__callPaginationQueryMethod(
        normalizedQuery.callQueryMethod as any,
        normalizedQuery,
      );
    } else {
      [result, total] = await this.defaultPaginationQuery(normalizedQuery);
    }

    response?.setHeader(Symbols.old.X_TOTAL_COUNT, String(total));

    return result;
    //#endregion
  }

  protected async defaultPaginationQuery(
    query: TaonPaginationQuery<ControllerClass>,
  ): Promise<[Entity[], number]> {
    //#region @websqlFunc
    const pageNumber = query.pageNumber ?? 1;
    const pageSize = query.pageSize ?? 10;

    const skip = (pageNumber - 1) * pageSize;

    const qb = this.db.createQueryBuilder('entity');

    //
    // GLOBAL SEARCH
    //
    if (query.search) {
      const searchableColumns = this.getPaginationSearchableColumns() || [];
      console.log(
        `Searching by ${query.search} in ${searchableColumns.join(',')}  columns ${this.db.metadata.columns.map(c => c.type)}`,
      );

      if (searchableColumns.length > 0) {
        qb.andWhere(
          new Brackets(subQb => {
            searchableColumns.forEach((field, index) => {
              const sql = `CAST(entity.${field} AS TEXT) LIKE :search`;

              if (index === 0) {
                subQb.where(sql, {
                  search: `%${query.search}%`,
                });
              } else {
                subQb.orWhere(sql, {
                  search: `%${query.search}%`,
                });
              }
            });
          }),
        );
      }
    }

    //
    // COLUMN FILTERS
    //
    for (const [field, value] of Object.entries(query.filters ?? {})) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (!this.isPaginationColumnAllowed(field)) {
        continue;
      }

      qb.andWhere(`CAST(entity.${field} AS TEXT) LIKE :filter_${field}`, {
        [`filter_${field}`]: `%${String(value)}%`,
      });
    }

    //
    // SORTING
    //
    if (
      query.sort?.field &&
      query.sort.direction &&
      this.isPaginationColumnAllowed(query.sort.field)
    ) {
      qb.orderBy(
        `entity.${query.sort.field}`,
        query.sort.direction.toUpperCase() as 'ASC' | 'DESC',
      );
    }

    qb.skip(skip);
    qb.take(pageSize);

    return qb.getManyAndCount();
    //#endregion
  }

  protected isPaginationColumnAllowed(field: string): boolean {
    return this.db.metadata.columns.some(
      column => column.propertyName === field,
    );
  }

  protected getPaginationSearchableColumns(): string[] {
    //#region @websqlFunc

    const searchableTypes = [
      // strings
      String,
      'varchar',
      'nvarchar',
      'varchar2',
      'character varying',
      'text',
      'tinytext',
      'mediumtext',
      'longtext',
      'char',
      'nchar',

      // numbers
      Number,
      'int',
      'integer',
      'tinyint',
      'smallint',
      'mediumint',
      'bigint',
      'float',
      'double',
      'decimal',
      'numeric',
      'real',
    ];

    return this.db.metadata.columns
      .filter(column => searchableTypes.includes(column.type as any))
      .map(column => column.propertyName);

    //#endregion
  }

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
  @GET()
  getBy(@Query(`id`) id: number | string): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.getBy(id);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region update by id
  @PUT()
  updateById(
    @Query(`id`) id: number | string,
    @Body() item: Entity,
  ): Models.Http.Response<Entity> {
    //#region @websqlFunc

    return async () => {
      const model = await this.db.updateById<Entity>(id, item as any);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region patch by id
  @PATCH()
  patchById(
    @Query(`id`) id: number | string,
    @Body() item: Entity,
  ): Models.Http.Response<Entity> {
    //#region @websqlFunc

    return async () => {
      const model = await this.db.updateById<Entity>(id, item as any);
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
  @DELETE()
  deleteById(@Query(`id`) id: number | string): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.deleteById(id as any);
      return model;
    };
    //#endregion
  }
  //#endregion

  //#region bulk delete
  @DELETE()
  bulkDelete(
    @Query(`ids`) ids: (number | string)[],
  ): Models.Http.Response<(number | string | Entity)[]> {
    //#region @websqlFunc
    return async () => {
      const models = await this.db.bulkDelete(ids);
      return models;
    };
    //#endregion
  }
  //#endregion

  //#region bulk delete
  @DELETE()
  clearTable(): Models.Http.Response<void> {
    //#region @websqlFunc
    return async () => {
      await this.db.clear();
    };
    //#endregion
  }
  //#endregion

  //#region create
  @POST()
  save(@Body() item: Entity): Models.Http.Response<Entity> {
    //#region @websqlFunc
    return async () => {
      const model = await this.db.save(item);
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
