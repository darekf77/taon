export type TaonEntityKeysToOmit =
  | 'ctrl'
  | 'clone'
  | '__endpoint_context__'
  | 'getOriginalConstructor'
  | 'getOriginalPrototype'
  | 'ctx'
  | 'inject'
  | '_'
  | 'relation'
  | 'relations'
  | 'inject'
  | 'injectRepo'
  | 'injectCustomRepository'
  | 'injectCustomRepo'
  | 'injectController'
  | 'injectCtrl'
  | 'injectProvider'
  | 'injectMiddleware';

export const TaonEntityKeysToOmitArr: TaonEntityKeysToOmit[] = [
  'ctrl',
  'clone',
  '__endpoint_context__',
  'getOriginalConstructor',
  'getOriginalPrototype',
  'ctx',
  'inject',
  '_',
  'relation',
  'relations',
  'inject',
  'injectRepo',
  'injectCustomRepository',
  'injectCustomRepo',
  'injectController',
  'injectCtrl',
  'injectProvider',
  'injectMiddleware',
];

import { InjectionToken } from '@angular/core';

import type { TaonContext } from './create-context';
import { TaonTranslationsMapImport } from '@taon-dev/i18n/src';

let TAON_CONTEXT: InjectionToken<TaonContext>;
//#region @browser
TAON_CONTEXT = new InjectionToken<TaonContext>('TAON_CONTEXT');
//#endregion

let CURRENT_HOST_BACKEND_PORT: InjectionToken<number>;
//#region @browser
CURRENT_HOST_BACKEND_PORT = new InjectionToken<number>(
  'CURRENT_HOST_BACKEND_PORT',
);
//#endregion

let CURRENT_HOST_URL: InjectionToken<string>;
//#region @browser
CURRENT_HOST_URL = new InjectionToken<string>('CURRENT_HOST_URL');
//#endregion

export { TAON_CONTEXT, CURRENT_HOST_BACKEND_PORT, CURRENT_HOST_URL };

export const TaonBaseRepositoryClassName = 'TaonBaseRepository';

export const TaonBaseStorageRepositoryClassName = 'TaonBaseStorageRepository';

export const apiPrefix = 'api';

export const Replecables = {
  /**
   * In runtime this becomes relative path to current file
   */
  __FILE_RELATIVE_PATH__: '',
  /**
   * In runtime this becomes taon translation impors for specyfic file
   */
  __LANG_IMPORT_MAP__: {} as TaonTranslationsMapImport,
};
