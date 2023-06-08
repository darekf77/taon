import { Firedev } from 'firedev';
import { _ } from 'tnp-core';
import type { MyEntityController } from './my-entity.controller';
import { defaultModelValues } from './my-entity.models';
@Firedev.Entity({
  className: 'MyEntity',
  defaultModelValues
})
export class MyEntity extends Firedev.Base.Entity<any> {

  //#region static
  static ctrl: MyEntityController;
  static from(obj: Omit<Partial<MyEntity>, 'ctrl'>) {
    return _.merge(new MyEntity(), obj) as MyEntity;
  }
  static getAll() {
    return this.ctrl.getAll();
  }
  static empty() {
    return MyEntity.from(defaultModelValues);
  }
  //#endregion

  //#region constructor
  private constructor(...args) { // @ts-ignore
    super(...args);
  }
  //#endregion

  //#region fields & getters
  ctrl: MyEntityController;

  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: defaultModelValues.description
  })
  //#endregion
  description?: string;
  //#endregion

  //#region methods
  clone(options?: { propsToOmit: keyof MyEntity[]; }): MyEntity {
    const { propsToOmit } = options || { propsToOmit: ['id', 'ctrl'] };
    return _.merge(new MyEntity(), _.omit(this, propsToOmit));
  }
  //#endregion

}
