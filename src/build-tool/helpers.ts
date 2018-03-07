import * as path from 'path';
import * as child from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import chalk from 'chalk';
const commandExistsSync = require('command-exists').sync;

export namespace Helpers {

  export async function checkEnvironment() {
    const globalDependencies = {
      npm: [
        'npm-run',
        'cpr'
      ]
    }

    globalDependencies.npm.forEach(name => {
      if (!commandExistsSync(name)) {
        console.log(chalk.red(`Missing npm dependency "${name}".`))
        const sudo = !(os.platform() === 'win32' || os.platform() === 'darwin')
        const cmd = `${sudo ? 'sudo' : ''}npm install -g ${name}`;
        console.log(`Please run: ${chalk.green(cmd)}`)
        process.exit(0)
      }
    })
  }

  export function isPlainFileOrFolder(filePath) {
    return /^([a-zA-Z]|\-|\_|\@|\#|\$|\!|\^|\&|\*|\(|\))+$/.test(filePath);
  }

  export function createLink(target, link) {
    if (isPlainFileOrFolder(link)) {
      link = path.join(process.cwd(), link);
    }

    let command: string;
    if (os.platform() === 'win32') {
      if (target === '.' || target === './') {
        target = path.win32.normalize(path.join(process.cwd(), path.basename(link)))
      } else {
        target = path.win32.normalize(path.join(target, path.basename(link)))
      }
      if (fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
      target = path.win32.normalize(target)
      if (link === '.' || link === './') {
        link = process.cwd()
      }
      link = path.win32.normalize(link)
      // console.log('taget', target)
      // console.log('link', link)
      command = "mklink \/D "
        + target
        + " "
        + link
        + " >nul 2>&1 "
      // console.log('LINK COMMAND', command)
    } else {
      if (link === '.' || link === './') {
        link = process.cwd()
      }
      command = `ln -sf "${link}" "${target}"`;
    }
    // console.log(command)
    return command;
  }

}



