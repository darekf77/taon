import { Taon } from 'taon/src';

@Taon.Entity({
  className: 'Session',
})
export class Session extends Taon.Base.Entity {
  //#region @websql
  @Taon.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Taon.Orm.Column.Number()
  //#endregion
  timeout: number;
}
