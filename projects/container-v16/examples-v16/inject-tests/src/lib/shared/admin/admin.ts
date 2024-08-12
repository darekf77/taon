import { Firedev } from 'firedev/src';
import { User } from '../user/user';

@Firedev.Entity({
  className: 'Admin',
  createTable: true,
})
export class Admin extends User {
  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  permissions: string;
}
