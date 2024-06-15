import { Helpers } from 'tnp-core/src';

const ENV = Helpers.isBrowser ? window['ENV'] : global['ENV'];

export { ENV };
