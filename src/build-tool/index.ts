//#region @backend
import { ps, crossPlatformPath, Helpers } from 'tnp-core';
import { MorphiHelpers } from '../helpers';
import { copyExampleTo } from './new';
import { IncrementalBuildProcess } from '../build/incremental-build-process';
import { BrowserCodeCut } from '../build/browser-code-cut';
import { CLI } from 'tnp-cli';
import { child_process, path, fse } from 'tnp-core';
import { PackagesRecognition } from '../build/packages-recognition';

export * from '../helpers';

export async function run(argsv: string[], morphiEnvironmentCheck = true) {
  if (morphiEnvironmentCheck) {
    CLI.checkEnvironment();
  }

  if (argsv.length >= 3) {
    const commandName: 'build' | 'build:watch' | 'ln' | 'new:simple' | 'new:workspace' | 'process-info'
      | '-v' | '-h' | '--help' | '-help' | 'update:isomorphic' | 'install' = argsv[2] as any;
    if (commandName === 'build') {
      PackagesRecognition.From(process.cwd()).start()
      BrowserCodeCut.resolveAndAddIsomorphicLibs(argsv.slice(4))
      await (new IncrementalBuildProcess()).start('isomprphic build')
      process.exit(0)
    } else if (commandName === 'install') {
      PackagesRecognition.From(process.cwd()).start(true)
      child_process.execSync(`npm i ${argsv.slice(3)}`, { cwd: process.cwd(), stdio: [0, 1, 2] });
      process.exit(0)
    } else if (commandName === 'update:isomorphic') {
      PackagesRecognition.From(process.cwd()).start(true)
      process.exit(0)
    } else if (commandName === 'build:watch') {
      PackagesRecognition.From(process.cwd()).start()
      BrowserCodeCut.resolveAndAddIsomorphicLibs(argsv.slice(4))
      await (new IncrementalBuildProcess()).startAndWatch('isomorphic build (watch)');
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
      const link = argsv[4]
      let target = argsv[3]
      Helpers.createSymLink(target, link);
      process.exit(0)
    } else if (commandName === '-v') {
      console.log(JSON.parse(fse.readFileSync(path.join(crossPlatformPath(__dirname), '../..', 'package.json').toString(), 'utf8').toString()).version)
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
- ${CLI.chalk.bold('morphi new:workspace myAppName')}
- ${CLI.chalk.bold('morphi new:simple myAppName')}
- ${CLI.chalk.bold('morphi build')}
- ${CLI.chalk.bold('morphi build:watch')}
- ${CLI.chalk.bold('morphi -v')}
- ${CLI.chalk.bold('morphi -h')}          `);
  process.exit(0)
}


function errorNew() {
  console.log(`Bad arguments..try:
${ CLI.chalk.bold('morphi new:workspace myAppName')}
or
${ CLI.chalk.bold('morphi new:simple myAppName')}
          `);
  process.exit(0)
}

//#endregion
