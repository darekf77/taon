import { Helpers } from 'tnp-core/src';

let win: any;
if (typeof window !== 'undefined') {
  win = window;
}
export const globalPublicStorage = Helpers.isBrowser ? win : global;
