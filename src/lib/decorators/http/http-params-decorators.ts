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
  let methodConfig: Models.MethodConfig = Reflect.getMetadata(
    Symbols.metadata.options.controllerMethod,
    target.constructor,
    propertyKey,
  );
  if (!methodConfig) {
    methodConfig = new Models.MethodConfig();
    Reflect.defineMetadata(
      Symbols.metadata.options.controllerMethod,
      methodConfig,
      target.constructor,
      propertyKey,
    );
  }

  const nameKey = name ? name : param;
  const p = (methodConfig.parameters[nameKey] = !methodConfig.parameters[
    nameKey
  ]
    ? new Models.ParamConfig()
    : methodConfig.parameters[nameKey]);
  p.index = parameterIndex;
  p.paramName = name;
  p.paramType = param;
  p.defaultType = defaultValue;
  p.expireInSeconds = expire;
  Reflect.defineMetadata(
    Symbols.metadata.options.controllerMethod,
    methodConfig,
    target.constructor,
    propertyKey,
  );
  // console.log('params updated', methodConfig);
}

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
