
import * as JSON5 from 'json5';
import * as _ from 'lodash';
import {
  Response, __Response, AsyncResponse,
  SyncResponse
} from "./models";
import { getClassConfig } from "ng2-rest";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { getEntityFieldsProperties } from './models-mapping';

export function getClassFromObject(o: Object) {
  const p = Object.getPrototypeOf(o)
  return p && p.constructor;
}

function isAsync(fn) {
  return fn && fn.constructor && fn.constructor.name === 'AsyncFunction';
}

/**
 * Backend only function
 */
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
      } catch (error) {
        console.error('Bad async function call ', error)
        reject(error);
      }
    } else if (typeof response === 'object') {
      try {
        if (typeof response.send === 'function') {
          const result = response.send(req, res) as any
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



export function tryTransformParam(param) {
  if (typeof param === 'string') {
    let n = Number(param);
    if (!isNaN(n)) return n;
    let b = Boolean(param);
    if (typeof b === 'boolean') return b;
    try {
      const t = JSON5.parse(param);
      return t;
    } catch (e) { }
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

export class Describer {
  private static FRegEx = new RegExp(/(?:this\.)(.+?(?= ))/g);


  /**
   * @DEPRECATED
   * Describe fields assigned in class
   */
  public static describe(target: Function, parent = false): string[] {
    var result = [];
    if (parent) {
      var proto = Object.getPrototypeOf(target.prototype);
      if (proto) {
        result = result.concat(this.describe(proto.constructor, parent));
      }
    }
    result = result.concat(target.toString().match(this.FRegEx) || []);
    return result.map(prop => prop.replace('this.', ''))

  }

  /**
   * Describe fields assigne through @DefaultModelWithMapping decorator
   * without functions
   */
  public static describeByDefaultModel(target: Function) {
    return getEntityFieldsProperties(target);
  }

  public static describeByEverything(target: Function) {
    const d1 = this.describe(target);
    const d2 = this.describeByDefaultModel(target);
    let uniq = {};
    d1.concat(d2).forEach(p => uniq[p] = p);
    return Object.keys(uniq).filter(d => !!d)
  }

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
