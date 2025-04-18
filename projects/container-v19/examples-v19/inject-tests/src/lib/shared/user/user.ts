import { Taon } from 'taon/src';

@Taon.Entity({
  className: 'User',
  createTable: true,
})
export class User extends Taon.Base.Entity {
  //#region @websql
  @Taon.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name: string;

  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  email: string;

  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  password: string;
   //#region @websql
   @Taon.Orm.Column.String()
   //#endregion
   theme: string;
}
