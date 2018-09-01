import * as path from 'path';
import * as child from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import * as rimraf from 'rimraf';
import { sleep } from 'sleep';
import check from 'check-node-version';

const commandExistsSync = require('command-exists').sync;


export interface GlobalNpmDependency {
  name: string; version?: string | number;
}

export interface GlobalCommandLineProgramDependency {
  name: string; website: string; version?: string;
}
export interface GlobalDependencies {
  npm?: GlobalNpmDependency[];
  programs?: GlobalCommandLineProgramDependency[];
}


export function tryRemoveDir(dirpath) {
  try {
    rimraf.sync(dirpath)
  } catch (e) {
    console.log(`Trying to remove directory: ${dirpath}`)
    sleep(1);
    tryRemoveDir(dirpath);
  }
}

export function tryCopyFrom(source, destination) {
  try {
    fse.copySync(source, destination, {
      overwrite: true
    })
  } catch (e) {
    console.log(`Trying to copy from: ${source} to ${destination}`)
    sleep(1);
    tryCopyFrom(source, destination)
  }
}


export const MorphiGlobalDependencies: GlobalDependencies = {
  npm: [
    { name: 'rimraf' },
    { name: 'npm-run' },
    { name: 'cpr' },
    { name: 'check-node-version' }
  ],
  programs: [
    // {
    //   name: 'code',
    //   website: 'https://code.visualstudio.com/'
    // }
  ] as { name: string; website: string }[]
}

export namespace Helpers {

  export function checkEnvironment(globalDependencies: GlobalDependencies = MorphiGlobalDependencies) {


    const missingNpm: GlobalNpmDependency[] = [];
    globalDependencies.npm.forEach(pkg => {
      if (!commandExistsSync(pkg.name)) {
        missingNpm.push(pkg)
      }
    })

    if (missingNpm.length > 0) {

      const toInstall = missingNpm
        .map(pkg => pkg.version ? `${pkg.name}@${pkg.version}` : pkg.name)
        .join(' ');
      console.log(chalk.red(`Missing npm dependencies.`))
      const cmd = `npm install -g ${toInstall}`;
      console.log(`Please run: ${chalk.green(cmd)}`)
      process.exit(0)
    }

    globalDependencies.programs.forEach(p => {
      if (!commandExistsSync(p.name)) {
        console.log(chalk.red(`Missing command line tool "${p.name}".`))
        console.log(`Please install it from: ${chalk.green(p.website)}`)
        process.exit(0)
      }
    })


    try {
      child.execSync(`check-node-version --node ">= 9.2"`, { stdio: [0, 1, 2] })
    } catch (error) {
      process.exit(0)
    }

  }

  export function isPlainFileOrFolder(filePath) {
    return /^([a-zA-Z]|\-|\_|\@|\#|\$|\!|\^|\&|\*|\(|\))+$/.test(filePath);
  }

  export function createLink(target: string, link: string) {
    if (isPlainFileOrFolder(link)) {
      link = path.join(process.cwd(), link);
    }

    let command: string;
    if (os.platform() === 'win32') {

      if (target.startsWith('./')) {
        target = path.win32.normalize(path.join(process.cwd(), path.basename(target)))
      } else {
        if (target === '.' || target === './') {
          target = path.win32.normalize(path.join(process.cwd(), path.basename(link)))
        } else {
          target = path.win32.normalize(path.join(target, path.basename(link)))
        }
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
      if (target.startsWith('./')) {
        target = target.replace(/^\.\//g, '');
      }
      if (link === '.' || link === './') {
        link = process.cwd()
      }
      command = `ln -sf "${link}" "${target}"`;
    }
    // console.log(command)
    return command;
  }

}



export function getRecrusiveFilesFrom(dir): string[] {
  let files = [];
  const readed = fs.readdirSync(dir).map(f => {
    const fullPath = path.join(dir, f);
    // console.log(`is direcotry ${fs.lstatSync(fullPath).isDirectory()} `, fullPath)
    if (fs.lstatSync(fullPath).isDirectory()) {
      getRecrusiveFilesFrom(fullPath).forEach(aa => files.push(aa))
    }
    return fullPath;
  })
  if (Array.isArray(readed)) {
    readed.forEach(r => files.push(r))
  }
  return files;
}

