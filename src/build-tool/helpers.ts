import * as path from 'path';
import * as child from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import chalk from 'chalk';
import check from 'check-node-version';

const commandExistsSync = require('command-exists').sync;

export namespace Helpers {

  export function checkEnvironment() {
    const globalDependencies = {
      npm: [
        'rimraf',
        'npm-run',
        'cpr',
        'check-node-version'
      ],
      programs: [
        {
          name: 'code',
          website: 'https://code.visualstudio.com/'
        }
      ] as { name: string; website: string }[]
    }

    globalDependencies.npm.forEach(name => {
      if (!commandExistsSync(name)) {
        console.log(chalk.red(`Missing npm dependency "${name}".`))
        const sudo = !(os.platform() === 'win32' || os.platform() === 'darwin')
        const cmd = `npm install -g ${name}`;
        console.log(`Please run: ${chalk.green(cmd)}`)
        process.exit(0)
      }
    })

    /*
    globalDependencies.programs.forEach(p => {
      if (!commandExistsSync(p.name)) {
        console.log(chalk.red(`Missing command line tool "${p.name}".`))
        console.log(`Please install it from: ${chalk.green(p.website)}`)
        process.exit(0)
      }
    })
    */

    try {
      child.execSync(`check-node-version --node ">= 9.2"`, { stdio: [0, 1, 2] })
    } catch (error) {
      process.exit(0)
    }

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



