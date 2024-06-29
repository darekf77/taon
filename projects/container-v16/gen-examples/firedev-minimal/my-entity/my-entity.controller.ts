//#region imports
import { Firedev, ClassHelpers } from 'firedev/src';
import { MyEntity } from './my-entity';
import { _ } from 'tnp-core';
//#endregion


@Firedev.Controller({
  //#region controller options
  className: 'MyEntityController',
  //#endregion
})
export class MyEntityController extends Firedev.Base.CrudController<MyEntity> {
  entityClassResolveFn: () => MyEntity;

  //#region methods & getters / hello world
  @Firedev.Http.GET()
  helloWord(@Firedev.Http.Param.Query('yourName') yourName:string): Firedev.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      const numOfEntities = await this.db.count();
      return `Hello ${yourName || 'world'} from ${ClassHelpers} `
      +`controller..  ${numOfEntities} entites in db..`;
    }
    //#endregion
  }
  //#endregion

  //#region methods & getters / init example data
  async initExampleDbData() {
    //#region @websqlFunc
    // await this.db.save(new MyEntity().clone({ description: 'hello world' }))
    // const all = await this.db.find()
    // console.log(`All entities of ${ClassHelpers.getName(MyEntity)}`, all)
    //#endregion
  }
  //#endregion
}
