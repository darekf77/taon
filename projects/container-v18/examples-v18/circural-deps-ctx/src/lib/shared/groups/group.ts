import { Firedev } from 'firedev/src';

@Firedev.Entity({
  className: 'Group',
})
export class Group extends Firedev.Base.Entity {
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  name: string;
}
