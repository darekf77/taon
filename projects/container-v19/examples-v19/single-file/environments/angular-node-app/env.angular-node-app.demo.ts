import type { EnvOptions } from 'tnp/src';
import baseEnv from './env.angular-node-app.__';

const env: Partial<EnvOptions> = {
  ...baseEnv,
  build: {
    ...baseEnv.build,
    angularProd: true,
    websql: true,
  },
};
export default env;
