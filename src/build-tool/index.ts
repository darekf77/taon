//#region @backend
import * as child from 'child_process';

import * as path from 'path';

import * as fs from 'fs';
const ps = require('ps-node');

import { Helpers } from '../helpers';
import { copyExampleTo } from './new';
import { IncrementalBuildProcess } from '../build/incremental-build-process';
import { BrowserCodeCut } from '../build/browser-code-cut';
import chalk from 'chalk';

export * from '../helpers';

export function run(argsv: string[], morphiEnvironmentCheck = true) {
  if (morphiEnvironmentCheck) {
    Helpers.checkEnvironment()
  }
  if (argsv.length >= 3) {
    const commandName: 'build' | 'build:watch' | 'ln' | 'new:simple' | 'new:workspace' | 'process-info' | '-v' | '-h' | '--help' | '-help' = argsv[2] as any;


    if (commandName === 'build') {
      BrowserCodeCut.resolveAndAddIsomorphicLibs(argsv.slice(4))
      new IncrementalBuildProcess().start('isomprphic build')
      process.exit(0)
    } else if (commandName === 'build:watch') {
      BrowserCodeCut.resolveAndAddIsomorphicLibs(argsv.slice(4))
      new IncrementalBuildProcess().startAndWatch('isomorphic build (watch)');
      process.stdin.resume();
    } else if (commandName === 'process-info') {
      // A simple pid lookup
      if (!Array.isArray(argsv) || argsv.length < 2) {
        console.log(`To few arguments for process-info function...`);
        process.exit(0)
      }
      const pid = argsv[3];
      ps.lookup({ pid }, function (err, resultList) {
        if (err) {
          throw new Error(err);
        }
        const process = resultList[0];
        if (process) {
          console.log(JSON.stringify(process));
        }
        else {
          console.log(JSON.stringify({}));
        }
      });
    } else if (commandName === '-h' || commandName === '-help' || commandName === '--help') {
      console.log('HELP  - WORK IN PROGRESS')
      console.log('Usage: morphi build <lib1> <lib2> ... ')
      console.log('Where lib(n) is name of included in node_modules isomorphic lib')
      console.log('Example isomorphic libs are: typeorm, ng2-rest, morphi...');
      process.exit(0)
    } else if (commandName === 'ln') {
      if (!Array.isArray(argsv) || argsv.length < 2) {
        console.log(`To few arguments for linking function...`);
        process.exit(0)
      }
      const link = argsv[3]
      let target = argsv[4]
      child.execSync(Helpers.createLink(target, link))
      process.exit(0)
    } else if (commandName === '-v') {
      console.log(JSON.parse(fs.readFileSync(path.join(__dirname, '../..', 'package.json').toString(), 'utf8').toString()).version)
      process.exit(0)
    } else if (commandName === 'new:workspace') {
      if (!Array.isArray(argsv) || argsv.length < 4) {
        errorNew()
      }
      const name = argsv[3]
      copyExampleTo(name, 'examples')
      process.exit(0)
    } else if (commandName === 'new:simple') {
      if (!Array.isArray(argsv) || argsv.length < 4) {
        errorNew()
      }
      const name = argsv[3]
      copyExampleTo(name, 'super-simple-morphi-example')
      process.exit(0)
    } else {
      errorAll()
      process.exit(0)
    }

  }

}

function errorAll() {
  console.log(`Bad arguments..try one of the command below:
- ${chalk.bold('morphi new:workspace myAppName')}
- ${chalk.bold('morphi new:simple myAppName')}
- ${chalk.bold('morphi build')}
- ${chalk.bold('morphi build:watch')}
- ${chalk.bold('morphi -v')}
- ${chalk.bold('morphi -h')}          `);
  process.exit(0)
}


function errorNew() {
  console.log(`Bad arguments..try:
${ chalk.bold('morphi new:workspace myAppName')}
or
${ chalk.bold('morphi new:simple myAppName')}
          `);
  process.exit(0)
}

//#endregion
