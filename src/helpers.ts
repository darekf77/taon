declare var require: any;
var JSON5 = require('json5');
import {
  CLASS_META_CONFIG, Response, isNode, isBrowser,
  ENDPOINT_META_CONFIG, SOCKET_MSG, __Response, AsyncResponse,
  SyncResponse
} from "./models";
import { ClassConfig, MethodConfig, ParamConfig, ParamType, HttpMethod, getClassConfig } from "ng2-rest";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";


// function isAsync(fn) {
//   return fn && fn.constructor && fn.constructor.name === 'AsyncFunction';
// }

export function getResponseValue<T>(response: Response<T>, req: ExpressRequest, res: ExpressResponse): Promise<SyncResponse<T>> {
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



export function getSingleton<T>(target: Function): T {
  const configs = getClassConfig(target)
  return ((Array.isArray(configs) && configs.length >= 1) ? configs[0].singleton : undefined) as any;
}
