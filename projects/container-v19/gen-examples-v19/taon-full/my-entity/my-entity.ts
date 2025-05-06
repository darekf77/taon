//#region imports
import { Taon } from 'taon/src';
import { _ } from 'tnp-core/src';

import { MyEntityDefaultsValues } from './my-entity.defaults-values';
//#endregion

@Taon.Entity({
  className: 'MyEntity',
  createTable: true,
})
export class MyEntity extends Taon.Base.AbstractEntity<MyEntity> {
  //#region @websql
  @Taon.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: MyEntityDefaultsValues.description
  })
  //#endregion
  description?: string;
}
