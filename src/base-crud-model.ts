import {
    __ENDPOINT, isNode,
    GET, PUT, POST, DELETE,
    Response,
    PathParam, BodyParam, OrmConnection
} from "./index";

import { Repository, Connection } from "typeorm";
import { Observable } from "rxjs/Observable";

const model = 'aaaaaa'

@__ENDPOINT(undefined, BaseCRUD)
export abstract class BaseCRUD<T>  {

    @OrmConnection connection: Connection;
    public get repository(): Repository<T> {
        return this.repo;
    }
    private repo: Repository<any>;
    public abstract entity: T;


    public __model = {
        getAll: () => this.getAll(),
        getOneBy: (id: number) => this.getBy(id),
        deleteBy: (id: number) => this.deleteById(id),
        updateById: (id: number, item: T) => this.updateById(id, item),
        create: (item: T) => this.create(item)
    }

    constructor() {
        console.log('Perfect')
        //#region @backendFunc
        if (isNode && this.entity) {
            this.repo = this.connection.getRepository(this.entity as any)
        }
        //#endregion
    }

    @GET(`/${model}`)
    getAll(): Response<T[]> {
        //#region @backendFunc
        return async () => {
            const models = await this.repo.find();
            return models;
        }
        //#endregion
    }

    @GET(`/${model}/:id`)
    getBy( @PathParam(`id`) id: number): Response<T> {
        //#region @backendFunc
        return async () => {
            const model = await this.repo.findOneById(id)
            return model;
        }
        //#endregion
    }

    @PUT(`/${model}/:id`)
    updateById( @PathParam(`id`) id: number, @BodyParam() item: T): Response<T> {
        //#region @backendFunc
        return async () => {
            await this.repo.updateById(id, item);
            return await this.repo.findOneById(id)
        }
        //#endregion
    }

    @DELETE(`/${model}/:id`)
    deleteById( @PathParam(`id`) id: number): Response<T> {
        //#region @backendFunc
        return async () => {
            const deletedEntity = await this.repo.findOneById(id)
            await this.repo.removeById(id);
            return deletedEntity;
        }
        //#endregion
    }


    @POST(`/${model}`)
    create( @BodyParam() item: T): Response<T> {
        //#region @backendFunc
        return async () => {
            const model = await this.repo.create(item)
            return model;
        }
        //#endregion
    }

}
