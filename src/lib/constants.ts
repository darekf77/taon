export type TaonEntityKeysToOmit =
  | 'ctrl'
  | 'clone'
  | '__endpoint_context__'
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
  | 'injectGlobalProvider'
  | 'injectLocalProvider'
  | 'injectContextProvider';

export const TaonEntityKeysToOmitArr: TaonEntityKeysToOmit[] = [
  'ctrl',
  'clone',
  '__endpoint_context__',
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
  'injectGlobalProvider',
  'injectLocalProvider',
  'injectContextProvider',
];

import { InjectionToken } from '@angular/core';

import type { TaonContext } from './create-context';

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

export { TAON_CONTEXT, CURRENT_HOST_BACKEND_PORT };
