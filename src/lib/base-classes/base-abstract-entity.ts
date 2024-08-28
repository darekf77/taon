//#region @websql
import { Entity } from 'taon-typeorm/src';
//#endregion
import { Orm } from '../orm';
import { BaseEntity } from './base-entity';
import type { BaseClass } from './base-class';

// empty decorator
let EntityDecorator = () => {
  return (target: any) => {};
};

//#region @websql
EntityDecorator = Entity;
//#endregion

@EntityDecorator()
export abstract class BaseAbstractEntity<
  CloneT extends BaseClass = any,
> extends BaseEntity<CloneT> {
  //#region @websql
  @Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Orm.Column.Version()
  //#endregion
  version: number;
}
