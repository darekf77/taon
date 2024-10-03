//#region imports
import type { MyEntity } from "./my-entity";
import { _ } from 'tnp-core';
//#region @websql
import { NumberColumn, PropsEntitySQL, QueryTable, StringColumn } from "taon-type-sql";
//#endregion
//#endregion

export const MY_ENTITY_TABLE_NAME = _.snakeCase('myEntity').toUpperCase();

export const MY_ENTITY_NON_COL_KEY_ARR = [
  'ctrl',
  'clone',
] as MyEntityNonColumnsKeys[];

export const DEF_MODEL_VALUE_MY_ENTITY: Omit<IMyEntity, MyEntityNonColumnsKeys> = {
  description: 'MyEntity example description',
}

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
