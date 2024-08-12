import { Firedev } from "firedev/src";

@Firedev.Entity({ className: 'User' })
export class User extends Firedev.Base.AbstractEntity {
  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  name?: string;
}
