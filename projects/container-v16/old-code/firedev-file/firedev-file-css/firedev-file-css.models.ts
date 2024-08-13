import type { FiredevFileCss } from './firedev-file-css';
import { _ } from 'tnp-core/src';
import { FIREDEV_FILE_CSS_TABLE_NAME } from './firedev-file-css.constants';
//#region @websql
import {
  NumberColumn,
  PropsEntitySQL,
  QueryTable,
  StringColumn,
} from 'firedev-type-sql';
//#endregion

export type FiredevFileCssNonColumnsKeys = 'ctrl' | 'clone' | 'getOptionsFor';

export const FiredevFileCssNonColumnsKeysArr = [
  'ctrl',
  'clone',
  'getOptionsFor',
] as FiredevFileCssNonColumnsKeys[];

export type IFiredevFileCss = Partial<FiredevFileCss>;

export const defaultModelValuesFiredevFileCss: Omit<
  IFiredevFileCss,
  FiredevFileCssNonColumnsKeys
> = {
  description: 'FiredevFileCss example description',
  width: 100,
  widthUnit: '%',
  height: 200,
  heightUnit: 'px',
  display: 'block',
};

export type DisplayOpt = 'block' | 'inline-block' | 'flex';
export const DisplayOptArr = ['block', 'inline-block', 'flex'] as DisplayOpt[];

export type BrowserUnit = 'px' | 'rem' | '%' | '';
export const BrowserUnitArr = ['px', 'rem', '%', ''] as BrowserUnit[];

export type BrowserHeightOrWidth = 'auto' | 'inherit';
export const BrowserHeightOrWidth = [
  'auto',
  'inherit',
] as BrowserHeightOrWidth[];
