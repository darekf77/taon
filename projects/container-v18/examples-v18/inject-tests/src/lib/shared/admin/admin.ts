import { Taon } from 'taon/src';
import { User } from '../user/user';

@Taon.Entity({
  className: 'Admin',
  createTable: true,
})
export class Admin extends User {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  permissions: string;
}
