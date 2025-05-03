//#region imports
import { Taon, ClassHelpers } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import { _ } from 'tnp-core/src';

import { MyEntity } from './my-entity';
//#endregion

@Taon.Controller({
  className: 'MyEntityRepository',
})
export class MyEntityRepository extends Taon.Base.Repository<MyEntity> {
  entityClassResolveFn: () => typeof MyEntity = () => MyEntity;

  /**
   * TODO remove this demo example method
   */
  async countEntitesWithEvenId(): Promise<number> {
    //#region @websqlFunc
    const result = await this.count({
      where: {
        id: Raw(alias => `${alias} % 2 = 0`),
      },
    });
    return result;
    //#endregion
  }
}
