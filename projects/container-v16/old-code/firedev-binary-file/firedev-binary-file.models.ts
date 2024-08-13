//#region imports
import type { FiredevBinaryFile } from './firedev-binary-file';
import { _ } from 'tnp-core/src';
import {
  FIREDEV_BINARY_FILE_TABLE_NAME,
  DEF_MODEL_VALUE_FIREDEV_BINARY_FILE,
} from './firedev-binary-file.constants';
//#region @websql
import {
  NumberColumn,
  PropsEntitySQL,
  QueryTable,
  StringColumn,
  BasicColumn,
} from 'firedev-type-sql';
//#endregion
//#endregion

//#region firedev binary file non columns key type
export type FiredevBinaryFileNonColumnsKeys = 'ctrl' | 'blob' | 'clone';
//#endregion

//#region firedev binary file partial type
export type IFiredevBinaryFile = Partial<FiredevBinaryFile>;
//#endregion

//#region firedev binary file table
//#region @websql
export type IFiredevBinaryFileTable = PropsEntitySQL<
  typeof DEF_MODEL_VALUE_FIREDEV_BINARY_FILE
>;

// @ts-ignore
export class FiredevBinaryFileTable
  extends QueryTable<FiredevBinaryFile, number>
  implements IFiredevBinaryFileTable
{
  id = new NumberColumn(this, 'id');
  src = new StringColumn(this, 'src');
  loadAs = new StringColumn(this, 'loadAs');

  //#region @websqlOnly
  isInIndexedDbCache = new BasicColumn(this, 'isInIndexedDbCache');
  //#endregion

  /**
   * dont use as column
   * @deprecated
   */
  binaryData = new BasicColumn(this, 'binaryData');
}

export const FIREDEV_BINARY_FILE = new FiredevBinaryFileTable(
  FIREDEV_BINARY_FILE_TABLE_NAME
);
//#endregion
//#endregion
