import { Helpers } from 'tnp-core/src';

let win: any;
if (typeof window !== 'undefined') {
  win = window;
}
const ENV = Helpers.isBrowser ? win?.ENV : global['ENV'];

export { ENV };
