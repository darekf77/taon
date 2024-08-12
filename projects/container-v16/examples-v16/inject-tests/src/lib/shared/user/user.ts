import { Firedev } from 'firedev/src';

@Firedev.Entity({
  className: 'User',
  createTable: true,
})
export class User extends Firedev.Base.Entity {
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  name: string;

  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  email: string;

  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  password: string;
   //#region @websql
   @Firedev.Orm.Column.String()
   //#endregion
   theme: string;
}
