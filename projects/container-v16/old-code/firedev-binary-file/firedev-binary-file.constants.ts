//#region imports
import { _ } from 'tnp-core/src';
import type {
  IFiredevBinaryFile,
  FiredevBinaryFileNonColumnsKeys,
} from './firedev-binary-file.models';
//#endregion

//#region constants
export const FORM_DATA_FILENAME = 'file';

export const FIREDEV_BINARY_FILE_TABLE_NAME =
  _.snakeCase('firedevBinaryFile').toUpperCase();
export const FIREDEV_BINARY_FILE_NON_COL_KEY_ARR = [
  'ctrl',
  'clone',
] as FiredevBinaryFileNonColumnsKeys[];

export const DEF_MODEL_VALUE_FIREDEV_BINARY_FILE: Omit<
  IFiredevBinaryFile,
  FiredevBinaryFileNonColumnsKeys
> = {
  src: 'FiredevBinaryFile example description',
};
//#endregion
