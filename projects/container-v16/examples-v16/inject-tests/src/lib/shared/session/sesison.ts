import { Firedev } from 'firedev/src';

@Firedev.Entity({
  className: 'Session',
})
export class Session extends Firedev.Base.Entity {
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.Number()
  //#endregion
  timeout: number;
}
