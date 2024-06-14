import { Helpers } from 'tnp-core/src';

export const globalPublicStorage = Helpers.isBrowser ? window : global;
