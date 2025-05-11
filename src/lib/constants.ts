export type TaonEntityKeysToOmit =
  | 'ctrl'
  | 'clone'
  | '__endpoint_context__'
  | 'ctx'
  | 'inject'
  | '_';

export const TaonEntityKeysToOmitArr: TaonEntityKeysToOmit[] = [
  'ctrl',
  'clone',
  '__endpoint_context__',
  'ctx',
  'inject',
  '_',
];

import { InjectionToken } from '@angular/core';

import type { TaonContext } from './create-context';

let TAON_CONTEXT: InjectionToken<TaonContext>;
//#region @browser
TAON_CONTEXT = new InjectionToken<TaonContext>('TAON_CONTEXT');
//#endregion
export { TAON_CONTEXT };
