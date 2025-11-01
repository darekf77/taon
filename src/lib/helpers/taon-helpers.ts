import * as JSON5 from 'json5';
import { _ } from 'tnp-core/src';

import type { ControllerConfig } from '../config/controller-config';
import { MethodConfig } from '../config/method-config';
import { Models } from '../models';

import { ClassHelpers } from './class-helpers';

export namespace TaonHelpers {
  //#region fillUpTo string
  export const fillUpTo = (s: string, nCharacters: number) => {
    return _.times(nCharacters, n => {
      if (s.charAt(n)) {
        return s.charAt(n);
      }
      return ' ';
    }).join('');
  };
  //#endregion

  //#region is good path
  export const isGoodPath = (p: string) => {
    return p && typeof p === 'string' && p.trim() !== '';
  };
  //#endregion

  export const firstStringOrElemFromArray = (
    stringOrArrayOfString: string[] | string,
  ): string => {
    if (Array.isArray(stringOrArrayOfString)) {
      return _.first(stringOrArrayOfString);
    }
    return stringOrArrayOfString;
  };

  //#region try transform params
  export const tryTransformParam = param => {
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
  };
  //#endregion

  //#region get expores path
  export const getExpressPath = (
    c: ControllerConfig,
    pathOrClassConfig: Partial<MethodConfig>,
  ) => {
    if (typeof pathOrClassConfig === 'string')
      return `${c.calculatedPath}${pathOrClassConfig}`.replace(/\/$/, '');
    return `${c.calculatedPath}${pathOrClassConfig.path}`.replace(/\/$/, '');
  };
  //#endregion

  //#region get default value tyep
  export const defaultType = value => {
    if (typeof value === 'string') return '';
    if (typeof value === 'boolean') return false;
    if (Array.isArray(value)) return {};
    if (typeof value === 'object') return {};
  };
  //#endregion

  //#region parse json with string jsons
  export const parseJSONwithStringJSONs = (
    object: Object,
    waring = false,
  ): Object => {
    // console.log('checking object', object)
    if (!_.isObject(object)) {
      if (waring) {
        console.error(
          `
        parseJSONwithStringJSONs(...)
        Parameter should be a object, but is ${typeof object}
        `,
          object,
        );
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
        res[key] = parseJSONwithStringJSONs(res[key], false);
      }
    });

    return res;
  };
  //#endregion

  //#region is plain file or folder
  export const isPlainFileOrFolder = filePath => {
    return /^([a-zA-Z]|\-|\_|\@|\#|\$|\!|\^|\&|\*|\(|\))+$/.test(filePath);
  };
  //#endregion

  //#region ips key name repsonse
  export const ipcKeyNameResponse = (
    target: Function,
    methodConfig: Partial<MethodConfig>,
    expressPath: string,
  ) => {
    return [
      'response',
      ClassHelpers.getName(target),
      methodConfig.methodName,
      methodConfig.type,
      expressPath,
    ].join('--');
  };
  //#endregion

  //#region ipc key name request
  export const ipcKeyNameRequest = (
    target: Function,
    methodConfig: Partial<MethodConfig>,
    expressPath: string,
  ) => {
    return [
      'request',
      ClassHelpers.getName(target),
      methodConfig.methodName,
      methodConfig.type,
      expressPath,
    ].join('--');
  };
  //#endregion

  //#region websql mocks
  export const websqlMocks = headers => {
    const response: Express.Response = {
      status(status: any) {
        // console.log({status})
        return {
          send(send: any) {
            // console.log({status})
          },
        };
      },
      setHeader(key: string, value: any) {
        // console.log('Dummy set header', arguments)
        headers[key] = value;
      },
    };
    const request: Express.Request = {};
    return { request, response };
  };
  //#endregion
}
