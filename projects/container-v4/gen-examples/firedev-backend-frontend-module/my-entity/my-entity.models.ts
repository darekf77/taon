import type { MyEntity } from "./my-entity";
import { _ } from 'tnp-core';
import { MY_ENTITY_TABLE_NAME } from "./my-entity.constants";
//#region @websql
import { NumberColumn, PropsEntitySQL, QueryTable, StringColumn } from "firedev-type-sql";
//#endregion

export type MyEntityNonColumnsKeys =
  'ctrl' |
  'clone';

export const MyEntityNonColumnsKeysArr = [
  'ctrl',
  'clone',
] as MyEntityNonColumnsKeys[];

export type IMyEntity = Partial<MyEntity>;

export const defaultModelValuesMyEntity: Omit<IMyEntity, MyEntityNonColumnsKeys> = {
  description: 'MyEntity example description',
}

//#region @websql
export type IMyEntityTable = PropsEntitySQL<typeof defaultModelValuesMyEntity>;

export class MyEntityTable extends QueryTable<MyEntity, number> implements IMyEntityTable {
  id = new NumberColumn(this, 'id');
  description = new StringColumn(this, 'description');
}

export const MY_ENTITY = new MyEntityTable(MY_ENTITY_TABLE_NAME);
//#endregion
