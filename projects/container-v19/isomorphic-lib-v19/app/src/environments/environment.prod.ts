// @ts-ignore
import * as ENV from '../../../../tmp-environment-for-browser.json';
import { EnvOptions } from 'tnp/browser'; // TODO replace when websql
const production = true;
// @ts-ignore
const env = EnvOptions.fromModule(ENV);
// @ts-ignore
window.ENV = env
// @ts-ignore
env.angularProd = production;

export const environment = {
  production
};
