//#region imports
import { Taon, ClassHelpers } from 'taon/src';
import { _ } from 'tnp-core/src';

import { MyEntity } from './my-entity';
//#endregion

@Taon.Controller({
  className: 'MyEntityController',
})
export class MyEntityController extends Taon.Base.CrudController<MyEntity> {
  entityClassResolveFn: () => typeof MyEntity = () => MyEntity;

  //#region methods & getters / hello world
  @Taon.Http.GET()
  helloWord(
    @Taon.Http.Param.Query('yourName') yourName: string,
  ): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      const numOfEntities = await this.db.count();
      return (
        `Hello ${yourName || 'world'} from ${ClassHelpers} ` +
        `controller..  ${numOfEntities} entites in db..`
      );
    };
    //#endregion
  }
  //#endregion
}
