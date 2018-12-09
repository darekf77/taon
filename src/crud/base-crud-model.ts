
import * as _ from 'lodash';
import { CLASSNAME, getClassFromObject } from 'ng2-rest';

import { Observable } from "rxjs/Observable";
import { isNode } from 'ng2-logger';
import { SYMBOL } from '../symbols';
import { ModelDataConfig } from './model-data-config';
import { __ENDPOINT } from '../decorators/decorators-endpoint-class';
import { GET, PUT, DELETE, POST } from '../decorators/decorators-methods';
import { Query, Path, Body } from '../decorators/decorators-params';
import { Response } from '../models';

//#region @backend
import { Repository, Connection, getRepository } from "typeorm";
import { tableNameFrom } from '../framework/framework-helpers';
import { OrmConnection } from '../decorators/decorators-endpoint-class';
//#endregion

@__ENDPOINT(BaseCRUD)
@CLASSNAME('BaseCRUD')
export abstract class BaseCRUD<T>  {

  //#region @backend
  @OrmConnection connection: Connection;
  public get repository(): Repository<T> {
    return this.repo;
  }
  private repo: Repository<any>;
  //#endregion

  public entity: T;

  constructor() {
    this.init()
  }

  private init() {
    //#region @backend
    if (isNode && this.entity && this.connection) {
      this.repo = this.connection.getRepository(this.entity as any)
      //  console.log(`Base CRUD inited for: ${(this.entity as any).name}`)
    }
    //#endregion
  }

  @GET(`/${SYMBOL.CRUD_TABLE_MODEL}`)
  getAll(@Query() config?: ModelDataConfig): Response<T[]> {
    //#region @backendFunc
    return async (request, response) => {

      const totalCount = await this.repo.count();
      const models = await this.repo.find(
        {
          where: config && config.db && config.db.where,
          join: config && config.db && config.db.join,
          skip: config && config.db && config.db.skip,
          take: config && config.db && config.db.take
        }
      );
      response.setHeader(SYMBOL.X_TOTAL_COUNT, totalCount)
      return models;
    }
    //#endregion
  }

  @GET(`/${SYMBOL.CRUD_TABLE_MODEL}/:id`)
  getBy(@Path(`id`) id: number, @Query() config?: ModelDataConfig): Response<T> {
    //#region @backendFunc
    return async () => {

      const model = await this.repo.findOne({
        where: _.merge({ id }, config && config.db && config.db.where),
        join: config && config.db && config.db.join
      })

      preventUndefinedModel(model, config, id)

      return model;
    }
    //#endregion
  }


  protected __realitmeUpdate(model: T) {

  }


  @PUT(`/${SYMBOL.CRUD_TABLE_MODEL}/:id`)
  updateById(@Path(`id`) id: number, @Body() item: T, @Query() config?: ModelDataConfig): Response<T> {
    //#region @backendFunc

    return async () => {

      for (const key in item) {
        if (item.hasOwnProperty(key) && typeof item[key] !== 'object') {
          await this.repo.query(`UPDATE "${tableNameFrom(this.entity as any)}" SET "${key}"="${item[key]}" WHERE "id"="${id}"`)
        }
      }
      // console.log('update ok!')
      let model = await this.repo.findOne({
        where: _.merge({ id }, config && config.db && config.db.where),
        join: config && config.db && config.db.join
      })
      preventUndefinedModel(model, config, id)

      this.__realitmeUpdate(model)
      return model;

    }
    //#endregion
  }

  @DELETE(`/${SYMBOL.CRUD_TABLE_MODEL}/:id`)
  deleteById(@Path(`id`) id: number): Response<T> {
    //#region @backendFunc
    return async () => {
      const deletedEntity = await this.repo.findOne(id)
      await this.repo.remove(id);
      return deletedEntity;
    }
    //#endregion
  }


  @POST(`/${SYMBOL.CRUD_TABLE_MODEL}/`)
  create(@Body() item: T, @Query() config?: ModelDataConfig): Response<T> {
    //#region @backendFunc
    return async () => {

      let model = await this.repo.create(item)
      model = await this.repo.save(model);
      const { id } = model;

      model = await this.repo.findOne({
        where: _.merge({ id }, config && config.db && config.db.where),
        join: config && config.db && config.db.join
      })
      return model;
    }
    //#endregion
  }

}

//#region @backend
function preventUndefinedModel(model, config, id) {
  if (_.isUndefined(model)) {
    console.error(config)
    throw `Bad update by id, config, id: ${id}`
  }
}

function forObjectPropertiesOf(item) {
  return {
    async run(action: (r: Repository<any>, partialItem: Object, entityClass?: Function, ) => Promise<any>) {
      const objectPropertiesToUpdate = [];
      Object.keys(item).forEach(propertyName => {
        const partialItem = item[propertyName];
        if (_.isObject(partialItem) && !_.isArray(partialItem)) {
          const entityClass = getClassFromObject(partialItem);
          const repo = entityClass && getRepository(entityClass);
          if (repo) {
            objectPropertiesToUpdate.push(action(repo, partialItem, entityClass))
          }
        }
      })
      return Promise.all(objectPropertiesToUpdate);
    }
  }
}
//#endregion
