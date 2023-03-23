import { Firedev } from 'firedev';
import { _ } from 'tnp-core';
import type { MyEntityController } from './my-entity.controller';

@Firedev.Entity({
  className: 'MyEntity'
})
export class MyEntity extends Firedev.Base.Entity<any> {
  static ctrl: MyEntityController;
  static from(obj: Omit<Partial<MyEntity>, 'ctrl'>) {
    return _.merge(new MyEntity(), obj)
  }

  static getAll() {
    return this.ctrl.getAll();
  }
  ctrl: MyEntityController;


  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;


}
