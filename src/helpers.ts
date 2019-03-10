
//#region @backend
import * as path from 'path';
import * as child from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import chalk from 'chalk';
import * as rimraf from 'rimraf';
import { sleep } from 'sleep';
import * as dateformat from "dateformat";
import check from 'check-node-version';
const commandExistsSync = require('command-exists').sync;
//#endregion

import * as JSON5 from 'json5';
import * as _ from 'lodash';


import { Helpers as HelpersNg2Rest } from "ng2-rest";
import { SYMBOL } from './symbols';
import { Models } from './models';

//#region @backend
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
//#endregion

export class Helpers extends HelpersNg2Rest {

  //#region @backend
  static get System() {

    return {
      get Operations() {
        return {
          tryRemoveDir(dirpath) {
            try {
              rimraf.sync(dirpath)
            } catch (e) {
              console.log(`Trying to remove directory: ${dirpath}`)
              sleep(1);
              this.tryRemoveDir(dirpath);
            }
          },

          tryCopyFrom(source, destination) {
            // console.log(`Trying to copy from hahah: ${source} to ${destination}`)
            try {
              fse.copySync(source, destination, {
                overwrite: true,
                recursive: true
              })
            } catch (e) {
              console.log(e)
              sleep(1);
              this.tryCopyFrom(source, destination)
            }
          }
        }
      }
    }
  }
  //#endregion

  static isGoodPath(p: string) {
    return p && typeof p === 'string' && p.trim() !== ''
  }

  static isRealtimeEndpoint(target: Function) {
    return target && target.prototype && target.prototype[SYMBOL.IS_ENPOINT_REALTIME];
  }


  static hasParentClassWithName(target: Function, name: string, targets = []): boolean {
    if (!target) {
      // console.log(`false "${_.first(targets).name}" for ${targets.map(d => d.name).join(',')}`)
      return false;
    }
    targets.push(target)
    let targetProto = target['__proto__'] as Function;
    if (targetProto && this.Class.getName(targetProto) === name) {
      // console.log(`true  "${_.first(targets).name}" for ${targets.map(d => d.name).join(',')}`)
      return true;
    }
    return this.hasParentClassWithName(targetProto, name, targets);
  }

  //#region @backend
  static async compilationWrapper(fn: () => void, taskName: string = 'Task', executionType: 'Compilation' | 'Code execution' = 'Compilation') {
    function currentDate() {
      return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
    }
    if (!fn || !_.isFunction(fn)) {
      console.error(`${executionType} wrapper: "${fs}" is not a function.`)
      process.exit(1)
    }

    try {
      console.log(chalk.gray(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" started...`))
      await Helpers.runSyncOrAsync(fn)
      console.log(chalk.green(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" finish OK...`))
    } catch (error) {
      console.log(chalk.red(error));
      console.log(`${currentDate()} ${executionType} of ${taskName} ERROR`)
    }

  }
  //#endregion


  static runSyncOrAsync(fn: Function) {
    // let wasPromise = false;
    let promisOrValue = fn()
    if (promisOrValue instanceof Promise) {
      // wasPromise = true;
      promisOrValue = Promise.resolve(promisOrValue)
    }
    // console.log('was promis ', wasPromise)
    return promisOrValue;
  }



  static tryTransformParam(param) {
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

  static getExpressPath(c: Models.Rest.ClassConfig, pathOrClassConfig: Models.Rest.MethodConfig | string) {
    if (typeof pathOrClassConfig === 'string') return `${c.calculatedPath}${pathOrClassConfig}`.replace(/\/$/, '')
    return `${c.calculatedPath}${pathOrClassConfig.path}`.replace(/\/$/, '')
  }

  static defaultType(value) {
    if (typeof value === 'string') return '';
    if (typeof value === 'boolean') return false;
    if (Array.isArray(value)) return {};
    if (typeof value === 'object') return {};
  }



  static getSingleton<T=Object>(target: Function): T {
    const configs = Helpers.Class.getConfig(target)
    return ((Array.isArray(configs) && configs.length >= 1) ? configs[0].singleton : undefined) as any;
  }


  static getSingletons<T=Object>(target: Function): T[] {
    const configs = Helpers.Class.getConfig(target)
    return configs.map(c => c.singleton as T);
  }



  static parseJSONwithStringJSONs(object: Object, waring = false): Object {
    // console.log('checking object', object)
    if (!_.isObject(object)) {
      if (waring) {
        console.error(`
        parseJSONwithStringJSONs(...)
        Parameter should be a object, but is ${typeof object}
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
        res[key] = this.parseJSONwithStringJSONs(res[key], false)
      }
    });

    return res;
  }




  //#region @backend




  static getResponseValue<T>(response: Models.Response<T>, req: ExpressRequest, res: ExpressResponse): Promise<Models.SyncResponse<T>> {
    //#region @backendFunc
    return new Promise<Models.SyncResponse<T>>(async (resolve, reject) => {
      const resp: Models.__Response<T> = response;
      if (!response && response.send === undefined) {
        console.error('Bad response value for function');
        resolve(undefined);
      }
      else if (typeof response === 'function') {
        const asyncResponse: Models.AsyncResponse<T> = response as any;
        try {
          const result = await asyncResponse(req, res);
          resolve(result as any);
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







  static MorphiGlobalDependencies: Models.GlobalDependencies = {
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



  static checkEnvironment(globalDependencies: Models.GlobalDependencies = this.MorphiGlobalDependencies) {


    const missingNpm: Models.GlobalNpmDependency[] = [];
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

  static isPlainFileOrFolder(filePath) {
    return /^([a-zA-Z]|\-|\_|\@|\#|\$|\!|\^|\&|\*|\(|\))+$/.test(filePath);
  }

  static log(proc: child.ChildProcess) {
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

  static createLink(target: string, link: string) {
    if (this.isPlainFileOrFolder(link)) {
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


  static getRecrusiveFilesFrom(dir): string[] {
    let files = [];
    const readed = fs.readdirSync(dir).map(f => {
      const fullPath = path.join(dir, f);
      // console.log(`is direcotry ${fs.lstatSync(fullPath).isDirectory()} `, fullPath)
      if (fs.lstatSync(fullPath).isDirectory()) {
        this.getRecrusiveFilesFrom(fullPath).forEach(aa => files.push(aa))
      }
      return fullPath;
    })
    if (Array.isArray(readed)) {
      readed.forEach(r => files.push(r))
    }
    return files;
  }

  //#endregion



}









