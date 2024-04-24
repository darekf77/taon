import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers/src';

function metaParam(param: Models.Rest.ParamType, name: string, expire: number, defaultValue = undefined, ...args: any[]) {
  const methodName = args[1];
  const config = CLASS.getConfig(args[0].constructor);
  const m = config.methods[methodName] = (!config.methods[methodName] ? new Models.Rest.MethodConfig() : config.methods[methodName]);

  const nameKey = name ? name : param;
  const p = m.parameters[nameKey] = (!m.parameters[nameKey] ? new Models.Rest.ParamConfig() : m.parameters[nameKey]);
  p.index = args[2];
  p.paramName = name;
  p.paramType = param;
  p.defaultType = defaultValue;
  p.expireInSeconds = expire;
}

export function Path(name: string) {
  return function (...args: any[]) {
    metaParam('Path', name, undefined, {}, ...args)
  };
}

export function Query(name?: string) {
  return function (...args: any[]) {
    metaParam('Query', name, undefined, {}, ...args)
  };
}

export function Cookie(name: string, expireInSecond: number = 3600) {
  return function (...args: any[]) {
    metaParam('Cookie', name, expireInSecond, {}, ...args)
  };
}

export function Header(name?: string) {
  return function (...args: any[]) {
    metaParam('Header', name, undefined, {}, ...args)
  };
}

export function Body(name?: string) {
  return function (...args: any[]) {
    metaParam('Body', name, undefined, {}, ...args)
  };
}
