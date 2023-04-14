import { _ } from 'tnp-core';
import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers';

function metaReq(
  method: Models.Rest.HttpMethod, path: string,
  target: any, propertyKey: string,
  descriptor: PropertyDescriptor, pathIsGlobal = false) {
  // const className = CLASS.getName(target.constructor);

  const config = CLASS.getConfig(target.constructor as any);
  // if (config.vChildren.length > 0) {
  // }
  config.methods[propertyKey] = (
    !config.methods[propertyKey] ? new Models.Rest.MethodConfig() : config.methods[propertyKey]
  );
  const methodConfig: Models.Rest.MethodConfig = config.methods[propertyKey];

  methodConfig.methodName = propertyKey;
  methodConfig.type = method;
  if (!path) {
    let paramsPathConcatedPath = '';
    for (const key in methodConfig.parameters) {
      if (methodConfig.parameters.hasOwnProperty(key)) {
        const element = methodConfig.parameters[key];
        if (element.paramType === 'Path' && _.isString(element.paramName) && element.paramName.trim().length > 0) {
          paramsPathConcatedPath += `/${element.paramName}/:${element.paramName}`
        }
      }
    }
    methodConfig.path = `/${propertyKey}${paramsPathConcatedPath}`
    // console.log(`Authogenerated path: `, m.path)
  } else {
    methodConfig.path = path;
  }

  methodConfig.descriptor = descriptor;
  methodConfig.global = pathIsGlobal;
}
export function GET(path?: string, pathIsGlobal = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('get', path, target, propertyKey, descriptor, pathIsGlobal);
  }
}

export function HEAD(path?: string, pathIsGlobal = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('head', path, target, propertyKey, descriptor, pathIsGlobal);
  }
}

export function POST(path?: string, pathIsGlobal = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('post', path, target, propertyKey, descriptor, pathIsGlobal);
  }
}

export function PUT(path?: string, pathIsGlobal = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('put', path, target, propertyKey, descriptor, pathIsGlobal);
  }
}

export function PATCH(path?: string, pathIsGlobal = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('patch', path, target, propertyKey, descriptor, pathIsGlobal);
  }
}

export function DELETE(path?: string, pathIsGlobal = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('delete', path, target, propertyKey, descriptor, pathIsGlobal);
  }
}
