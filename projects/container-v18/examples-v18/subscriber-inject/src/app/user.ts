import { Taon } from "taon/src";

@Taon.Entity({ className: 'User' })
export class User extends Taon.Base.AbstractEntity {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name?: string;
}
