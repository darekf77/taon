import { Taon } from 'taon/src';

@Taon.Entity({
  className: 'Group',
})
export class Group extends Taon.Base.Entity {
  //#region @websql
  @Taon.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name: string;
}
