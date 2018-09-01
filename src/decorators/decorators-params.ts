import { ClassConfig, MethodConfig, ParamConfig, ParamType, HttpMethod, getClassConfig } from "ng2-rest";

function metaParam(param: ParamType, name: string, expire: number, defaultValue = undefined, ...args: any[]) {
  const methodName = args[1];
  const configs = getClassConfig(args[0].constructor);
  let c = configs[0];
  const m = c.methods[methodName] = (!c.methods[methodName] ? new MethodConfig() : c.methods[methodName]);

  const nameKey = name ? name: param;
  const p = m.parameters[nameKey] = (!m.parameters[nameKey] ? new ParamConfig() : m.parameters[nameKey]);
  p.index = args[2];
  p.paramName = name;
  p.paramType = param;
  p.defaultType = defaultValue;
  p.expireInSeconds = expire;
}

export function PathParam(name: string) {
  return function (...args: any[]) {
    metaParam('Path', name, undefined, {}, ...args)
  };
}

export function QueryParam(name?: string) {
  return function (...args: any[]) {
    metaParam('Query', name, undefined, {}, ...args)
  };
}

export function CookieParam(name: string, expireInSecond: number = 3600) {
  return function (...args: any[]) {
    metaParam('Cookie', name, expireInSecond, {}, ...args)
  };
}

export function HeaderParam(name?: string) {
  return function (...args: any[]) {
    metaParam('Header', name, undefined, {}, ...args)
  };
}

export function BodyParam(name?: string) {
  return function (...args: any[]) {
    metaParam('Body', name, undefined, {}, ...args)
  };
}

