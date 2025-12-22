import { Entity, VersionColumn } from 'taon-typeorm/src'; // @websql

import {
  Generated,
  GeneratedColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  VirtualColumn,
} from '../orm';

import type { TaonBaseClass } from './base-class';
import { TaonBaseEntity } from './base-entity';

//#region @websql
@Entity()
//#endregion
export abstract class TaonBaseAbstractEntity<
  CloneT extends TaonBaseClass = any,
> extends TaonBaseEntity<CloneT> {
  //#region @websql
  @PrimaryGeneratedColumn()
  //#endregion
  id: string;

  //#region @websql
  @VersionColumn()
  //#endregion
  version: number;
}

export type AbstractEntityOmitKeys<ENTITY> = Omit<
  ENTITY,
  'id' | 'version' | '_' | 'clone'
>;
