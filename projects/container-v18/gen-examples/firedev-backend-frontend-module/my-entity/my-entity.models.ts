//#region imports
import type { MyEntity } from "./my-entity";
import { _ } from 'tnp-core';
import { MY_ENTITY_TABLE_NAME, DEF_MODEL_VALUE_MY_ENTITY } from "./my-entity.constants";
//#region @websql
import { NumberColumn, PropsEntitySQL, QueryTable, StringColumn } from "firedev-type-sql";
//#endregion
//#endregion

//#region my entity non columns key type
export type MyEntityNonColumnsKeys =
  'ctrl' |
  'clone';
//#endregion

//#region my entity partial type
export type IMyEntity = Partial<MyEntity>;
//#endregion

//#region my entity table
//#region @websql
export type IMyEntityTable = PropsEntitySQL<typeof DEF_MODEL_VALUE_MY_ENTITY>;

export class MyEntityTable extends QueryTable<MyEntity, number> implements IMyEntityTable {
  id = new NumberColumn(this, 'id');
  description = new StringColumn(this, 'description');
}

export const MY_ENTITY = new MyEntityTable(MY_ENTITY_TABLE_NAME);
//#endregion
//#endregion
