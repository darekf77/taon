
import * as _ from 'lodash';
import { HttpMethod, getClassConfig, MethodConfig, } from "ng2-rest";

function metaReq(
  method: HttpMethod, path: string,
  target: any, propertyKey: string,
  descriptor: PropertyDescriptor, realtimeUpdate = false) {
  const configs = getClassConfig(target.constructor);
  const c = configs[0];
  const m: MethodConfig = c.methods[propertyKey] = (!c.methods[propertyKey] ? new MethodConfig() : c.methods[propertyKey]);
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
    metaReq('GET', path, target, propertyKey, descriptor, realtimeUpdate);
  }
}
export function POST(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('POST', path, target, propertyKey, descriptor);
  }
}

export function PUT(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('PUT', path, target, propertyKey, descriptor);
  }
}

export function DELETE(path?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metaReq('DELETE', path, target, propertyKey, descriptor);
  }
}

