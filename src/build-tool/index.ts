import * as child from 'child_process';
import * as dateformat from "dateformat";

import { Helpers } from './helpers';
import { buildIsomorphicVersion } from "./build";
import { copyExampleTo } from './new';

export * from './helpers';
export * from './build';

export function run(argsv: string[]) {

  if (argsv.length >= 3) {
    const commandName: 'build' | 'ln' | 'new' = argsv[2] as any;


    if (commandName === 'build') {
      const date = `[${dateformat(new Date(), 'HH:MM:ss')}]`;
      try {
        console.log(`${date} Building....`)
        buildIsomorphicVersion();
        console.log(`${date} Typescript compilation OK`)
      } catch (error) {
        console.error(`${date} Typescript compilation ERROR`)
        process.exit(0)
      }

    } else if (commandName === 'ln') {
      if (!Array.isArray(argsv) || argsv.length < 2) {
        console.log(`To few arguments for linking function...`);
        process.exit(0)
      }
      const link = argsv[3]
      let target = argsv[4]
      child.execSync(Helpers.createLink(target, link))
    } else if (commandName === 'new') {
      if (!Array.isArray(argsv) || argsv.length < 4) {
        console.log(`To few arguments.. try: morphi new myAppName`);
        process.exit(0)
      }
      const name = argsv[3]
      copyExampleTo(name)
    }
    process.exit(0)

  }

}


