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

/**
 * Normal query param
 */
export function Query(name?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Query',
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

/**
 * Query param that container json
 * data with circural object refrences
 */
export function QueryCirc(name?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Query',
      name,
      undefined,
      {},
      target,
      propertyKey,
      parameterIndex,
      true,
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

/**
 * Normal body param
 */
export function Body(name?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Body',
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

/**
 * Body param that container json
 * data with circural object refrences
 */
export function BodyCirc(name?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam(
      'Body',
      name,
      undefined,
      {},
      target,
      propertyKey,
      parameterIndex,
      true,
    );
  };
}
