import { CoreModels, UtilsHttp, _ } from 'tnp-core/src';

import { ClassHelpers } from '../../helpers/class-helpers';
import { Models } from '../../models';
import { Symbols } from '../../symbols';

function metaParam(
  param: UtilsHttp.ParamType,
  name: string,
  expire: number,
  defaultValue = undefined,
  target: Function,
  propertyKey: string | symbol,
  parameterIndex: number,
  sendCircuralObject: boolean,
) {
  const methodCfg = ClassHelpers.ensureMethodConfig(target, propertyKey);
  const nameKey = name ? name : param;
  // const key = name || `${param}_${parameterIndex}`;
  methodCfg.parameters[nameKey] = {
    index: parameterIndex,
    paramName: name,
    paramType: param,
    defaultType: defaultValue,
    expireInSeconds: expire,
    sendCircuralObject,
  };

  // console.log('params updated', methodConfig);
}

type OptionParams = { name?: string; circ?: boolean };
type StringOrOpt = string | OptionParams;

/**
 * @deprecated use Taon.Http.Param.Path (is more safe and cleaner)
 */
export function Path(name: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Path',
      name,
      undefined,
      {},
      target,
      propertyKey,
      parameterIndex,
      false,
    );
  };
}

export function Query(name?: StringOrOpt) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Query',
      _.isString(name) ? name : _.isObject(name) ? name.name : void 0,
      undefined,
      {},
      target,
      propertyKey,
      parameterIndex,
      _.isObject(name) ? !!(name as OptionParams).circ : false,
    );
  };
}

export function Cookie(name: string, expireInSecond: number = 3600) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Cookie',
      name,
      expireInSecond,
      {},
      target,
      propertyKey,
      parameterIndex,
      false,
    );
  };
}

export function Header(name?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Header',
      name,
      undefined,
      {},
      target,
      propertyKey,
      parameterIndex,
      false,
    );
  };
}

export function Body(name?: StringOrOpt) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Body',
      _.isString(name) ? name : _.isObject(name) ? name.name : void 0,
      undefined,
      {},
      target,
      propertyKey,
      parameterIndex,
      _.isObject(name) ? !!(name as OptionParams).circ : false,
    );
  };
}
