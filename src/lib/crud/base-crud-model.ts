import { _, Helpers } from 'tnp-core';
import { CLASS } from 'typescript-class-helpers';
import { SYMBOL } from '../symbols';
import { __ENDPOINT } from '../decorators/decorators-endpoint-class';
import { GET, PUT, DELETE, POST, HEAD, PATCH } from '../decorators/decorators-methods';
import { Query, Path, Body } from '../decorators/decorators-params';
import { Models } from '../models';

//#region @websql
import { Repository, Connection } from 'firedev-typeorm';
import { FrameworkContext } from '../framework/framework-context';
import { DbCrud } from './db-crud';
declare const global: any;
import { CrudHelpers } from './crud-helpers';
//#endregion

const Firedev = {
  symbols: SYMBOL,
  Http: {
    GET, PUT, DELETE, POST, HEAD, PATCH
  }
}

@CLASS.NAME('BaseCRUD')
@__ENDPOINT(BaseCRUD)
export abstract class BaseCRUD<T> {
  //#region @websql
  connection: Connection;
  public get repository(): Repository<T> {
    return this.repo;
  }
  private repo: Repository<any>;
  //#endregion

  public entity: any;

  constructor() {
    this.init()
  }

  //#region @websql
  readonly db: DbCrud<T>;
  //#endregion

  private init() {
    //#region @websql
    // debugger
    const context = FrameworkContext.findForTraget(this);
    this.connection = context.connection;

    if (
      (Helpers.isNode
        //#region @websqlOnly
        || Helpers.isWebSQL
        //#endregion
      )
      && this.entity && this.connection && this.entity[SYMBOL.HAS_TABLE_IN_DB]) {
      this.repo = this.connection.getRepository(this.entity as any)
      Helpers.log(`Base CRUD inited for: ${(this.entity as any).name}`);
      // @ts-ignore
      this.db = DbCrud.from(this.connection, this.entity);
    } else {
      Helpers.log(`Base CRUD NOT inited for: ${this.entity && (this.entity as any).name}`)
    }
    //#endregion
  }

  @Firedev.Http.GET(`/${Firedev.symbols.CRUD_TABLE_MODEL}/:id/property/:property`)
  bufforedChanges(
    @Path(`id`) id: number | string,
    @Path(`property`) property: string,
    @Query('alreadyLength') alreadyLength?: number
  ): Models.Response<string | any[]> {
    //#region @websqlFunc
    return async (request, response) => {

      const model = await CrudHelpers.getModel(id, this.repo);
      if (model === void 0) {
        return;
      }
      CrudHelpers.preventUndefinedModel(model, id)
      let value = model[property];
      let result: any;
      if (_.isString(value) || _.isArray(value)) {
        result = (value as string).slice(alreadyLength);

      }
      // console.log(`result for id:${id}, prop: ${property}, alredylength: ${alreadyLength}`, result)

      return result;
    }
    //#endregion
  }


  @Firedev.Http.GET(`/${Firedev.symbols.CRUD_TABLE_MODELS}`)
  getAll(): Models.Response<T[]> {
    //#region @websqlFunc
    return async (request, response) => {
      if (this.repo) {
        const { models, totalCount } = await this.db.getAll();
        response.setHeader(SYMBOL.X_TOTAL_COUNT, totalCount)
        return models;
      }
      return [];
    }
    //#endregion
  }

  @Firedev.Http.GET(`/${Firedev.symbols.CRUD_TABLE_MODEL}/:id`)
  getBy(@Path(`id`) id: number | string): Models.Response<T> {
    //#region @websqlFunc
    return async () => {
      const { model } = await this.db.getBy(id);
      return model;
    }
    //#endregion
  }


  @Firedev.Http.PUT(`/${Firedev.symbols.CRUD_TABLE_MODEL}/:id`)
  updateById(@Path(`id`) id: number | string, @Body() item: T): Models.Response<T> {
    //#region @websqlFunc

    return async () => {
      const { model } = await this.db.updateById(id, item as any);
      return model;

    }
    //#endregion
  }

  @Firedev.Http.PUT(`/bulk/${Firedev.symbols.CRUD_TABLE_MODELS}`)
  bulkUpdate(@Body() items: T[]): Models.Response<T[]> {
    //#region @websqlFunc
    return async () => {
      if (!Array.isArray(items) || (items?.length === 0)) {
        return [];
      }
      const { models } = await this.db.bulkUpdate(items);
      return models;
    }
    //#endregion
  }

  @Firedev.Http.DELETE(`/${Firedev.symbols.CRUD_TABLE_MODEL}/:id`)
  deleteById(@Path(`id`) id: number): Models.Response<T> {
    //#region @websqlFunc
    return async () => {
      const { model } = await this.db.deleteById(id);
      return model;
    }
    //#endregion
  }

  @Firedev.Http.DELETE(`/bulk/${Firedev.symbols.CRUD_TABLE_MODELS}/:ids`)
  bulkDelete(@Path(`ids`) ids: (number | string)[]): Models.Response<(number | string | T)[]> {
    //#region @websqlFunc
    return async () => {
      const { models } = await this.db.bulkDelete(ids);
      return models;
    }
    //#endregion
  }


  @Firedev.Http.POST(`/${Firedev.symbols.CRUD_TABLE_MODEL}/`)
  create(@Body() item: T): Models.Response<T> {
    //#region @websqlFunc
    return async () => {
      const { model } = await this.db.create(item as any);
      return model;
    }
    //#endregion
  }

  @Firedev.Http.POST(`/bulk/${Firedev.symbols.CRUD_TABLE_MODELS}/`)
  bulkCreate(@Body() items: T): Models.Response<T[]> {
    //#region @websqlFunc
    return async () => {
      const { models } = await this.db.bulkCreate(items as any);
      return models;
    }
    //#endregion
  }

}
