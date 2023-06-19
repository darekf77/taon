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
//#endregion

@Firedev.Controller({
  className: 'MyEntityController',
  entity: MyEntity
})
export class MyEntityController extends Firedev.Base.Controller<any> {
  entity: typeof MyEntity;

  @Firedev.Http.GET()
  hello(): Firedev.Response<string> {
    //#region @websqlFunc
    return async () => {
      return 'Hello world';
    }
    //#endregion
  }

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

  @Firedev.Http.POST()
  createTestObjecttMyEntity(
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

  //#region @websql
  async initExampleDbData() {
    // const repo = this.connection.getRepository(MyEntity);
    // await repo.save(MyEntity.from({ description: 'hello world' }))
    // const all = await repo.find()
  }
  //#endregion

}
