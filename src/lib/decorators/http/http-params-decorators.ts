import { ClassHelpers } from '../../helpers/class-helpers';
import { Models } from '../../models';
import { Symbols } from '../../symbols';

function metaParam(
  param: Models.Http.Rest.ParamType,
  name: string,
  expire: number,
  defaultValue = undefined,
  target: Function,
  propertyKey: string | symbol,
  parameterIndex: number,
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
    metaParam('Path', name, undefined, {}, target, propertyKey, parameterIndex);
  };
}

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
    );
  };
}

export function Body(name?: string) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    metaParam('Body', name, undefined, {}, target, propertyKey, parameterIndex);
  };
}
