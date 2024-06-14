//#region @websql
import { Entity } from 'firedev-typeorm/src';
//#endregion
import { Orm } from '../orm';
import { BaseEntity } from './base-entity';

//#region @websql
@Entity()
//#endregion
export abstract class BaseAbstractEntity extends BaseEntity {
  //#region @websql
  @Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Orm.Column.Version()
  //#endregion
  version: number;
}
