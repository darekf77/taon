//#region @websql
import { Entity } from 'taon-typeorm/src';
//#endregion
import { Orm } from '../orm';
import { TaonBaseEntity } from './base-entity';
import type { TaonBaseClass } from './base-class';

// empty decorator
let EntityDecorator = () => {
  return (target: any) => {};
};

//#region @websql
EntityDecorator = Entity;
//#endregion

@EntityDecorator()
export abstract class TaonBaseAbstractEntity<
  CloneT extends TaonBaseClass = any,
> extends TaonBaseEntity<CloneT> {
  //#region @websql
  @Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Orm.Column.Version()
  //#endregion
  version: number;
}

export type AbstractEntityOmitKeys<ENTITY> = Omit<ENTITY, 'id' | 'version'|  '_' | 'clone'>;
