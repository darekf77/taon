
import * as _ from 'lodash';
import { CLASSNAME } from 'ng2-rest';

import { Observable } from "rxjs/Observable";
import { SYMBOL } from '../symbols';
import { ModelDataConfig } from './model-data-config';
import { __ENDPOINT } from '../decorators/decorators-endpoint-class';
import { GET, PUT, DELETE, POST } from '../decorators/decorators-methods';
import { Query, Path, Body } from '../decorators/decorators-params';
import { Models } from '../models';


//#region @backend
import { Repository, Connection, getRepository } from "typeorm";
import { tableNameFrom } from '../framework/framework-helpers';
import { OrmConnection } from '../decorators/orm-connection';
import { Helpers } from '../helpers';
import { IBASE_ENTITY } from '../framework/framework-entity';
//#endregion

@__ENDPOINT(BaseCRUD)
@CLASSNAME.CLASSNAME('BaseCRUD')
export abstract class BaseCRUD<T>  {

  //#region @backend
  @OrmConnection connection: Connection;
  public get repository(): Repository<T> {
    return this.repo;
  }
  private repo: Repository<any>;
  //#endregion

  public entity: any;

  constructor() {
    this.init()
  }

  private init() {
    //#region @backend
    if (Helpers.isNode && this.entity && this.connection && this.entity[SYMBOL.HAS_TABLE_IN_DB]) {
      this.repo = this.connection.getRepository(this.entity as any)
      //  console.log(`Base CRUD inited for: ${(this.entity as any).name}`)
    }
    //#endregion
  }

  @GET(`/${SYMBOL.CRUD_TABLE_MODEL}/:id/property/:property`)
  bufforedChanges(
    @Path(`id`) id: number,
    @Path(`property`) property: string,
    @Query('alreadyLength') alreadyLength?: number,
    @Query('config') config?: ModelDataConfig
  ): Models.Response<string | any[]> {
    //#region @backendFunc
    return async (request, response) => {

      const model = await getModel(id, config, this.repo);

      preventUndefinedModel(model, config, id)
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


  @GET(`/${SYMBOL.CRUD_TABLE_MODEL}`)
  getAll(@Query('config') config?: ModelDataConfig): Models.Response<T[]> {
    //#region @backendFunc
    return async (request, response) => {

      const totalCount = await this.repo.count();
      const models = await getModels(config, this.repo);
      response.setHeader(SYMBOL.X_TOTAL_COUNT, totalCount)
      prepareData(models, config)
      return models;
    }
    //#endregion
  }

  @GET(`/${SYMBOL.CRUD_TABLE_MODEL}/:id`)
  getBy(@Path(`id`) id: number, @Query('config') config?: ModelDataConfig): Models.Response<T> {
    //#region @backendFunc
    return async () => {

      const model = await getModel(id, config, this.repo);
      prepareData(model, config, id)
      return model;
    }
    //#endregion
  }


  @PUT(`/${SYMBOL.CRUD_TABLE_MODEL}/:id`)
  updateById(@Path(`id`) id: number, @Body() item: T, @Query('config') config?: ModelDataConfig): Models.Response<T> {
    //#region @backendFunc

    return async () => {

      for (const key in item) {
        if (item.hasOwnProperty(key) && typeof item[key] !== 'object') {
          await this.repo.query(`UPDATE "${tableNameFrom(this.entity as any)}" SET "${key}"="${item[key]}" WHERE "id"="${id}"`)
        }
      }
      // console.log('update ok!')
      let model = await getModel(id, config, this.repo);

      prepareData(model, config, id)
      return model;

    }
    //#endregion
  }

  @DELETE(`/${SYMBOL.CRUD_TABLE_MODEL}/:id`)
  deleteById(@Path(`id`) id: number, @Query('config') config?: ModelDataConfig): Models.Response<T> {
    //#region @backendFunc
    return async () => {
      const deletedEntity = await getModel(id, config, this.repo);
      await this.repo.remove(id);
      prepareData(deletedEntity, config, id)
      return deletedEntity;
    }
    //#endregion
  }


  @POST(`/${SYMBOL.CRUD_TABLE_MODEL}/`)
  create(@Body() item: T, @Query('config') config?: ModelDataConfig): Models.Response<T> {
    //#region @backendFunc
    return async () => {

      let model = await this.repo.create(item)
      model = await this.repo.save(model);
      const { id } = model;

      model = await getModel(id, config, this.repo);

      prepareData(model, config, id)
      return model;
    }
    //#endregion
  }

}

//#region @backend

async function getModels(config: ModelDataConfig, repo: any) {
  let res = await repo.find(
    {
      where: config && config.db && config.db.where,
      join: config && config.db && config.db.join,
      skip: config && config.db && config.db.skip,
      take: config && config.db && config.db.take
    }
  );
  return res;
}

async function getModel(id: number, config: ModelDataConfig, repo: any) {
  let res = await repo.findOne({
    where: _.merge({ id }, config && config.db && config.db.where),
    join: config && config.db && config.db.join
  })
  return res;
}

function prepareData(data: IBASE_ENTITY | IBASE_ENTITY[], config: ModelDataConfig, id?: number) {
  preventUndefinedModel(data, config, id);
  if (_.isObject(config)) {
    if (!(config instanceof ModelDataConfig)) {
      console.error(`Config not instance of ModelDataConfig`)
      return
    }
    if (_.isArray(data)) {
      data.forEach(d => d.modelDataConfig = config)
    } else if (_.isObject(data)) {
      data.modelDataConfig = config;
    }
  }
}

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
          const entityClass = Helpers.Class.getFromObject(partialItem);
          const repo = entityClass && entityClass[SYMBOL.HAS_TABLE_IN_DB] && getRepository(entityClass);
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
