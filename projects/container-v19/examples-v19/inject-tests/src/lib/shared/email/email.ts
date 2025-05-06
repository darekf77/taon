//#region imports
import { Taon } from 'taon/src';
import { _ } from 'tnp-core/src';

import { EmailDefaultsValues } from './email.defaults-values';
//#endregion

@Taon.Entity({
  className: 'Email',
  createTable: true,
})
export class Email extends Taon.Base.AbstractEntity<Email> {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  address?: string;
}
