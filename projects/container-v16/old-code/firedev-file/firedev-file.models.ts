//#region imports
import type { FiredevFile } from './firedev-file';
//#endregion

//#region models
/**
 * @deprecated
 */
export type IFiredevFile = Partial<FiredevFile>;

/**
 * @deprecated
 */
export type IFiredevFileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'html'
  | 'text'
  | 'md'
  | 'json'
  | 'js'
  | 'css';

/**
 * @deprecated
 */
export type FiredevFileDefaultAs =
  | 'script-tag'
  | 'css-tag'
  | 'textarea'
  | 'wysig-editor'
  | 'video-tag'
  | 'audio-tag'
  | 'text-string'
  | 'img-tag'
  | 'html-rendered'
  | 'json-editor';
//#endregion
