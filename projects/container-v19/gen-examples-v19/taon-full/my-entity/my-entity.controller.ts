//#region imports
import { Taon, ClassHelpers } from 'taon/src';
import { _ } from 'tnp-core/src';

import { MyEntity } from './my-entity';
import { MyEntityRepository } from './my-entity.repository';
//#endregion

@Taon.Controller({
  className: 'MyEntityController',
})
export class MyEntityController extends Taon.Base.CrudController<MyEntity> {
  entityClassResolveFn: () => typeof MyEntity = () => MyEntity;

  myEntityRepository = this.injectCustomRepo(MyEntityRepository);

  //#region methods & getters / hello world
  /**
   * TODO remove this demo example method
   */
  @Taon.Http.GET()
  helloWord(
    @Taon.Http.Param.Query('yourName') yourName: string,
  ): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      const numOfEntities = await this.db.count();
      const numberOfEvenEntities =
        await this.myEntityRepository.countEntitesWithEvenId();
      return `Hello ${yourName || 'world'} from ${ClassHelpers}
      controller..  ${numOfEntities} entites in db..
      ${numberOfEvenEntities} entites with even ids (2,4,6,8 etc.)
      `;
    };
    //#endregion
  }
  //#endregion
}
