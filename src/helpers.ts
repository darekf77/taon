
//#region @backend
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
//#endregion

import * as JSON5 from 'json5';
import * as _ from 'lodash';


import {
  Response, __Response, AsyncResponse,
  SyncResponse
} from "./models";
import { getClassConfig } from "ng2-rest";
//#region @backend
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
//#endregion

export namespace Helpers {

  export function isAsync(fn) {
    return fn && fn.constructor && fn.constructor.name === 'AsyncFunction';
  }


  export function tryTransformParam(param) {
    if (typeof param === 'string') {
      let n = Number(param);
      if (!isNaN(n)) return n;
      const bool = param.trim().toLowerCase();
      if (bool === 'true') {
        return true;
      }
      if (bool === 'false') {
        return false;
      }
      try {
        const t = JSON5.parse(param);
        return t;
      } catch (e) {
        return param;
      }
    }
    return param;
  }

  export function defaultType(value) {
    if (typeof value === 'string') return '';
    if (typeof value === 'boolean') return false;
    if (Array.isArray(value)) return {};
    if (typeof value === 'object') return {};
  }



  export function getSingleton<T=Object>(target: Function): T {
    const configs = getClassConfig(target)
    return ((Array.isArray(configs) && configs.length >= 1) ? configs[0].singleton : undefined) as any;
  }


  export function getSingletons<T=Object>(target: Function): T[] {
    const configs = getClassConfig(target)
    return configs.map(c => c.singleton as T);
  }



  export function parseJSONwithStringJSONs(object: Object, waring = true): Object {
    // console.log('checking object', object)
    if (!_.isObject(object)) {
      if (waring) {
        console.error(`
        parseJSONwithStringJSONs(...)
        Parameter should be a object
        `, object)
      }

      return object;
    }

    let res = _.cloneDeep(object);

    Object.keys(res).forEach(key => {
      let isJson = false;
      try {
        const possibleJSON = JSON.parse(res[key]);
        res[key] = possibleJSON;
        isJson = true;
      } catch (e) {
        isJson = false;
      }
      // console.log(`key ${key} is json `, isJson)
      if (isJson) {
        res[key] = parseJSONwithStringJSONs(res[key], false)
      }
    });

    return res;
  }


}












//#region @backend

export namespace HelpersBackend {


  export function getResponseValue<T>(response: Response<T>, req: ExpressRequest, res: ExpressResponse): Promise<SyncResponse<T>> {
    //#region @backendFunc
    return new Promise<SyncResponse<T>>(async (resolve, reject) => {
      const resp: __Response<T> = response;
      if (!response && response.send === undefined) {
        console.error('Bad response value for function');
        resolve(undefined);
      }
      else if (typeof response === 'function') {
        const asyncResponse: AsyncResponse<T> = response as any;
        try {
          const result = await asyncResponse(req, res);
          resolve(result);
        } catch (e) {
          if (e && e.stack) {
            console.log(e.stack)
          }
          console.error('Bad async function call ', e)
          reject(e);
        }
      } else if (typeof response === 'object') {
        try {
          if (typeof response.send === 'function') {
            const result = (response as any).send(req, res) as any
            resolve(result)
          } else {
            resolve(response.send as any)
          }
        } catch (error) {
          console.error('Bad synchonus function call ', error)
          reject(error);
        }
      } else reject(`Not recognized type of reposne ${response}`);
    });
    //#endregion
  }

  export interface GlobalNpmDependency {
    name: string; installName?: string; version?: string | number;
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
    // console.log(`Trying to copy from hahah: ${source} to ${destination}`)
    try {
      fse.copySync(source, destination, {
        overwrite: true,
        recursive: true
      })
    } catch (e) {
      console.log(e)
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



  export function checkEnvironment(globalDependencies: GlobalDependencies = MorphiGlobalDependencies) {


    const missingNpm: GlobalNpmDependency[] = [];
    globalDependencies.npm.forEach(pkg => {
      if (!commandExistsSync(pkg.name)) {
        missingNpm.push(pkg)
      }
    })

    if (missingNpm.length > 0) {

      const toInstall = missingNpm
        .map(pkg => {
          const n = pkg.installName ? pkg.installName : pkg.name
          return pkg.version ? `${n}@${pkg.version}` : n
        })
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

  export function log(proc: child.ChildProcess) {
    // processes.push(proc);


    // let stdio = [0,1,2]
    proc.stdout.on('data', (data) => {
      process.stdout.write(data)
      // console.log(data.toString());
    })

    proc.stdout.on('error', (data) => {
      process.stdout.write(JSON.stringify(data))
      // console.log(data);
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(data);
      // console.log(data.toString());
    })

    proc.stderr.on('error', (data) => {
      process.stderr.write(JSON.stringify(data))
      // console.log(data);
    })
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

}


//#endregion