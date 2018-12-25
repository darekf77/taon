
import * as _ from 'lodash';
import { Helpers } from '../helpers';
import { Models } from '../models';


function metaReq(
  method: Models.Rest.HttpMethod, path: string,
  target: any, propertyKey: string,
  descriptor: PropertyDescriptor, realtimeUpdate = false) {
  const configs = Helpers.Class.getConfig(target.constructor);
  const c = configs[0];
  const m: Models.Rest.MethodConfig = c.methods[propertyKey] = (!c.methods[propertyKey] ? new Models.Rest.MethodConfig() : c.methods[propertyKey]);
  m.methodName = propertyKey;
  m.type = method;
  // debugger
  if (!path) {
    let paramsPathConcatedPath = '';
    for (const key in m.parameters) {
      if (m.parameters.hasOwnProperty(key)) {
        const element = m.parameters[key];
        if (element.paramType === 'Path' && _.isString(element.paramName) && element.paramName.trim().length > 0) {
          paramsPathConcatedPath += `/${element.paramName}/:${element.paramName}`
        }
      }
    }
    m.path = `/${propertyKey}${paramsPathConcatedPath}`
    // console.log(`Authogenerated path: `, m.path)
  } else {
    m.path = path;
  }

  m.descriptor = descriptor;
  m.realtimeUpdate = realtimeUpdate;
}
export function GET(path?: string, realtimeUpdate = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('get', path, target, propertyKey, descriptor, realtimeUpdate);
  }
}

export function HEAD(path?: string, realtimeUpdate = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('head', path, target, propertyKey, descriptor, realtimeUpdate);
  }
}

export function POST(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('post', path, target, propertyKey, descriptor);
  }
}

export function PUT(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('put', path, target, propertyKey, descriptor);
  }
}

export function PATCH(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('patch', path, target, propertyKey, descriptor);
  }
}

export function DELETE(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('delete', path, target, propertyKey, descriptor);
  }
}

