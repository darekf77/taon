//#region imports
import { Firedev } from 'firedev';
import { MyEntity } from './my-entity';
import { _ } from 'tnp-core';
import {
  randUserName,
  randAddress,
} from '@ngneat/falso'; // faking data
import { IMyEntity } from './my-entity.models';
//#region @websql
import { MY_ENTITY } from './my-entity.models';
import { MyEntityBackend } from './backend/my-entity-backend';
//#endregion
//#endregion

/**
 * Isomorphic Controller for MyEntity
 *
 * + only create here isomorphic controller methods
 * + use this.backend for any backend/db operations
 */
@Firedev.Controller({
  //#region controller options
  className: 'MyEntityController',
  entity: MyEntity,
  //#endregion
})
export class MyEntityController extends Firedev.Base.Controller<any> {
  //#region fields
  entity: typeof MyEntity;
  //#region @websql
  readonly backend = MyEntityBackend.for(this);
  //#endregion
  //#endregion

  //#region hello world
  @Firedev.Http.GET()
  hello(): Firedev.Response<string> {
    //#region @websqlFunc
    return async () => {
      return 'Hello world';
    }
    //#endregion
  }
  //#endregion

  //#region get list of all
  @Firedev.Http.GET()
  getListOfAll(): Firedev.Response<MyEntity[]> {
    //#region @websqlFunc
    return async () => {
      const entites = await this.dbQuery
        .from(MY_ENTITY)
        .select<MyEntity>(MY_ENTITY.$all)
        ;
      return entites;
    }
    //#endregion
  }
  //#endregion

  //#region create test object of my entity
  @Firedev.Http.POST()
  createTestObjectOfMyEntity(
    @Firedev.Http.Param.Body('body') body: IMyEntity,
  ): Firedev.Response<MyEntity> {
    //#region @websqlFunc
    return async () => {
      let item = this.entity.from(body);
      item = await this.repository.save(item);
      return item;
    }
    //#endregion
  }
  //#endregion

  //#region get all
  @Firedev.Http.GET(`/${Firedev.symbols.CRUD_TABLE_MODELS}`) // @ts-ignore
  getAll(@Firedev.Http.Param.Query('limit') limit = Infinity): Firedev.Response<MyEntity[]> {
    //#region @websqlFunc
    const config = super.getAll();
    return async (req, res) => { // @ts-ignore
      let arr = await Firedev.getResponseValue(config, req, res) as MyEntity[];
      if (arr.length > limit) {
        arr = arr.slice(0, limit - 1);
      }
      return arr as any;
    }
    //#endregion
  }
  //#endregion

  //#region init example data
  //#region @websql
  async initExampleDbData() {
    await this.backend.initExampleDbData()
    // const repo = this.connection.getRepository(MyEntity);
    // await repo.save(MyEntity.from({ description: 'hello world' }))
    // const all = await repo.find()
  }
  //#endregion
  //#endregion
}
