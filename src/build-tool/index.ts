import * as child from 'child_process';

import { Helpers } from './helpers';
import { buildIsomorphicVersion } from "./build";

export * from './helpers';
export * from './build';

export function run(argsv: string[]) {

  if (argsv.length >= 3) {
    const commandName: 'build' | 'ln' = argsv[2] as any;


    if (commandName === 'build') {
      buildIsomorphicVersion();
      process.exit(0)
    } else if (commandName === 'ln') {

      // console.log(args)
      if (!Array.isArray(argsv) || argsv.length < 2) {
        throw new Error(`To few arguments for linking function...`);
      }
      const link = argsv[3]
      let target = argsv[4]
      child.execSync(Helpers.createLink(target, link))
      process.exit(0)
    }

  }

}


