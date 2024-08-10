//#region imports
import { Firedev } from 'firedev';
import { _ } from 'tnp-core';
import { MyEntityDefaultsValues } from './my-entity.defaults-values';
//#endregion

@Firedev.Entity({
  className: 'MyEntity',
  createTable: true,
})
export class MyEntity extends Firedev.Base.AbstractEntity<any> {
  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: MyEntityDefaultsValues.description
  })
  //#endregion
  description?: string;
}
