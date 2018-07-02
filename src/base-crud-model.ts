import {
  __ENDPOINT,
  GET, PUT, POST, DELETE,
  Response,
  PathParam,
  BodyParam,
  //#region @backend
  OrmConnection
  //#endregion
} from "./index";

import { CLASSNAME } from 'ng2-rest';
import { Repository, Connection } from "typeorm";
import { Observable } from "rxjs/Observable";
import { isNode } from 'ng2-logger';

@__ENDPOINT(BaseCRUD)
@CLASSNAME('BaseCRUD')
export abstract class BaseCRUD<T>  {

  //#region @backend
  @OrmConnection connection: Connection;
  public get repository(): Repository<T> {
    return this.repo;
  }
  private repo: Repository<any>;
  public entity: T;
  //#endregion

  public __model = {
    getAll: () => this.getAll(),
    getOneBy: (id: number) => this.getBy(id),
    deleteById: (id: number) => this.deleteById(id),
    updateById: (id: number, item: T) => this.updateById(id, item),
    create: (item: T) => this.create(item)
  }

  constructor() {
    this.init()
  }

  private init() {
    //#region @backend
    if (isNode && this.entity) {
      this.repo = this.connection.getRepository(this.entity as any)
      // console.log(`Base CRUD inited for: ${(this.entity as any).name}`)
    }
    //#endregion
  }

  @GET(`/`)
  getAll(): Response<T[]> {
    //#region @backendFunc
    return async () => {
      const models = await this.repo.find();
      return models;
    }
    //#endregion
  }

  @GET(`/:id`)
  getBy(@PathParam(`id`) id: number): Response<T> {
    //#region @backendFunc
    return async () => {
      const model = await this.repo.findOneById(id)
      return model;
    }
    //#endregion
  }

  @PUT(`/:id`)
  updateById(@PathParam(`id`) id: number, @BodyParam() item: T): Response<T> {
    //#region @backendFunc
    return async () => {
      await this.repo.updateById(id, item);
      return await this.repo.findOneById(id)
    }
    //#endregion
  }

  @DELETE(`/:id`)
  deleteById(@PathParam(`id`) id: number): Response<T> {
    //#region @backendFunc
    return async () => {
      const deletedEntity = await this.repo.findOneById(id)
      await this.repo.removeById(id);
      return deletedEntity;
    }
    //#endregion
  }


  @POST(`/`)
  create(@BodyParam() item: T): Response<T> {
    //#region @backendFunc
    return async () => {
      const model = await this.repo.create(item)
      return model;
    }
    //#endregion
  }

}
