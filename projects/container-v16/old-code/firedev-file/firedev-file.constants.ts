//#region imports
import { FiredevFileCss } from './firedev-file-css/firedev-file-css';
import type { IFiredevFile, IFiredevFileType } from './firedev-file.models';
//#endregion

//#region constants
/**
 * @deprecated
 */
export const DEFAULT_WIDTH = 244;

/**
 * @deprecated
 */
export const DEFAULT_HEIGHT = 177;

/**
 * @deprecated
 */
export const defaultModelValues: IFiredevFile = {
  css: FiredevFileCss.from({ display: 'block' }),
};

/**
 * @deprecated
 */
export const FiredevFileTypeArr = [
  'image',
  'video',
  'audio',
  'html',
  'text',
  'md',
  'json',
  'js',
  'css',
] as IFiredevFileType[];
//#endregion
