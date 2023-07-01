//#region imports
import { Firedev } from 'firedev';
import { _ } from 'tnp-core';
import { map } from 'rxjs';
import type { MyEntityController } from './my-entity.controller';
import {
  MyEntityNonColumnsKeys,
} from './my-entity.models';
import {
  MY_ENTITY_NON_COL_KEY_ARR,
  DEF_MODEL_VALUE_MY_ENTITY as defaultModelValues
} from './my-entity.constants';
//#endregion

/**
 * Entity class for MyEntity
 *
 * + use static methods to for backend access encapsulation
 */
@Firedev.Entity({
  //#region entity options
  className: 'MyEntity',
  defaultModelValues,
  //#region @websql
  createTable: false,
  //#endregion
  //#endregion
})
export class MyEntity extends Firedev.Base.Entity<any> {
  //#region static
  static ctrl: MyEntityController;
  static from(obj: Omit<Partial<MyEntity>, MyEntityNonColumnsKeys>) {
    obj = _.merge(defaultModelValues, _.omit(obj, MY_ENTITY_NON_COL_KEY_ARR))
    return _.merge(new MyEntity(), obj) as MyEntity;
  }
  static $getAll() {
    return this.ctrl.getAll().received?.observable.pipe(
      map(data => data.body?.json || [])
    );
  }

  static async getAll() {
    const data = await this.ctrl.getAll().received;
    return data?.body?.json || [];
  }

  static emptyModel() {
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
  clone(options?: { propsToOmit: (keyof MyEntity)[]; }): MyEntity {
    const { propsToOmit } = options || { propsToOmit: MY_ENTITY_NON_COL_KEY_ARR };
    return _.merge(new MyEntity(), _.omit(this, propsToOmit));
  }
  //#endregion
}
