//#region imports
import { Firedev } from 'firedev';
import { MyEntity } from './my-entity';
import { _ } from 'tnp-core';
import {
  randUserName,
  randAddress,
} from '@ngneat/falso'; // faking data
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
    // const repo = this.connection.getRepository(MyEntity);
    // await repo.save(MyEntity.from({ description: 'hello world' }))
    // const all = await repo.find()
  }
  //#endregion
  //#endregion
}
