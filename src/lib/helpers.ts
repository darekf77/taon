import { _ } from 'tnp-core';
//#region @backend
import {
  path,
  fse,
  rimraf,
  crossPlatformPath,
  os,
  child_process,
  http, https,
} from 'tnp-core';
import { CLI } from 'tnp-cli';
import * as dateformat from 'dateformat';

//#endregion

import * as JSON5 from 'json5';
import { Helpers as HelpersNg2Rest } from 'ng2-rest';
import { SYMBOL } from './symbols';
import { Models } from './models';

//#region @backend
import { Response as ExpressResponse, Request as ExpressRequest } from 'express';
//#endregion
import { CLASS } from 'typescript-class-helpers';

export class MorphiHelpers extends HelpersNg2Rest {

  //#region @backend
  static get System() {

    return {
      get Operations() {
        return {
          tryRemoveDir(dirpath) {
            rimraf.sync(dirpath);
          },

          tryCopyFrom(source, destination, options = {}) {
            // console.log(`Trying to copy from hahah: ${source} to ${destination}`)
            fse.copySync(source, destination, _.merge({
              overwrite: true,
              recursive: true
            }, options));
          }
        }
      }
    }
  }
  //#endregion

  static string(s: string) {
    return {
      fillUpTo(nCharacters: number) {
        return _.times(nCharacters, n => {
          if (s.charAt(n)) {
            return s.charAt(n);
          }
          return ' ';
        }).join('')
      }
    }
  }

  static isGoodPath(p: string) {
    return p && typeof p === 'string' && p.trim() !== ''
  }

  static getPathFor(target: Function) {
    const configs = CLASS.getConfigs(target) as any[];
    // console.log(`Class config for ${CLASS.getName(target)}`, configs)
    const classConfig: Models.Rest.ClassConfig = configs[0];
    const parentscalculatedPath = _
      .slice(configs, 1)
      .reverse()
      .map(bc => {
        if (MorphiHelpers.isGoodPath(bc.path)) {
          return bc.path
        }
        return CLASS.getName(bc.classReference);
      }).join('/');

    return `/${parentscalculatedPath}/${CLASS.getName(target)}`;
  }

  static hasParentClassWithName(target: Function, name: string, targets = []): boolean {
    if (!target) {
      // console.log(`false "${_.first(targets).name}" for ${targets.map(d => d.name).join(',')}`)
      return false;
    }
    targets.push(target)
    let targetProto = target['__proto__'] as Function;
    if (_.isFunction(targetProto) && CLASS.getName(targetProto) === name) {
      // console.log(`true  "${_.first(targets).name}" for ${targets.map(d => d.name).join(',')}`)
      return true;
    }
    return this.hasParentClassWithName(targetProto, name, targets);
  }

  //#region @backend
  // static async compilationWrapper(fn: () => void, taskName: string = 'Task', executionType: 'Compilation' | 'Code execution' = 'Compilation') {
  //   function currentDate() {
  //     return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
  //   }
  //   if (!fn || !_.isFunction(fn)) {
  //     console.error(`${executionType} wrapper: "${fn}" is not a function.`)
  //     process.exit(1)
  //   }

  //   try {
  //     console.log(CLI.chalk.gray(`${currentDate()} ${executionType} of "${CLI.chalk.bold(taskName)}" started...`))
  //     await Helpers.runSyncOrAsync(fn)
  //     console.log(CLI.chalk.green(`${currentDate()} ${executionType} of "${CLI.chalk.bold(taskName)}" finish OK...`))
  //   } catch (error) {
  //     console.log(CLI.chalk.red(error));
  //     console.log(`${currentDate()} ${executionType} of ${taskName} ERROR`)
  //   }

  // }
  //#endregion

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

  static isPlainFileOrFolder(filePath) {
    return /^([a-zA-Z]|\-|\_|\@|\#|\$|\!|\^|\&|\*|\(|\))+$/.test(filePath);
  }


  static getRecrusiveFilesFrom(dir): string[] {
    let files = [];
    const readed = fse.readdirSync(dir).map(f => {
      const fullPath = crossPlatformPath(path.join(dir, crossPlatformPath(f)));
      // console.log(`is direcotry ${fs.lstatSync(fullPath).isDirectory()} `, fullPath)
      if (fse.lstatSync(fullPath).isDirectory()) {
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
