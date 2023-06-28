//#region imports
import { _ } from 'tnp-core';
import type { IMyEntity, MyEntityNonColumnsKeys } from './my-entity.models';
//#endregion

//#region constants
export const MY_ENTITY_TABLE_NAME = _.snakeCase('myEntity').toUpperCase();
export const MY_ENTITY_NON_COL_KEY_ARR = [
  'ctrl',
  'clone',
] as MyEntityNonColumnsKeys[];

export const DEF_MODEL_VALUE_MY_ENTITY: Omit<IMyEntity, MyEntityNonColumnsKeys> = {
  description: 'MyEntity example description',
}
//#endregion
