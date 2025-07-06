import { Helpers } from 'tnp-core/src';

let win: any;
if (typeof window !== 'undefined') {
  win = window;
}
win = win || globalThis;
export const globalPublicStorage = Helpers.isBrowser ? win : global;
