
//#region @backend
import { Response, Request, NextFunction, RequestHandler } from "express";
//#endregion

import { Observable } from 'rxjs/Observable';
import { HttpResponse, HttpMethod, HttpCode, PromiseObservableMix } from "ng2-rest";
import { Connection } from "typeorm";
import 'rxjs/add/operator/map'
export const isNode = (typeof window === 'undefined')
export const isBrowser = !isNode;

export const CLASS_META_CONFIG = '$$rest_config';

export const MAPPING_CONFIG_HEADER = 'mappingheader'
export const ENDPOINT_META_CONFIG = 'ng2_rest_endpoint_config'
export const METHOD_DECORATOR = '$$ng2_rest_method'
export const CLASS_DECORATOR = '$$ng2_rest_class'
export const CLASS_DECORATOR_CONTEXT = '$$ng2_rest_class_context'
export const SOCKET_MSG = 'socketmessageng2rest';
export type ParamType = 'Path' | 'Query' | 'Cookie' | 'Header' | 'Body';

export type ContextENDPOINT = { target: Function; initFN: Function; };

export interface GlobalVars {
  app: any;
  socket: any;
  endpoints: ContextENDPOINT[],
  entities: Function[];
  connection: Connection;
  base_controllers: Function[];
};

export function getExpressPath(c: ClassConfig, pathOrClassConfig: MethodConfig | string) {
  if (typeof pathOrClassConfig === 'string') return `${c.basePath}${pathOrClassConfig}`.replace(/\/$/, '')
  return `${c.basePath}${pathOrClassConfig.path}`.replace(/\/$/, '')
}

// export function getExpressPath(basePath: string, path: string, a =) {
//     return `${basePath}${path}`.replace(/\/$/, '')
// }


export class ParamConfig {
  name: string;
  paramType: ParamType;
  index: number;
  defaultType: any;
  expireInSeconds?: number;
}

export class MethodConfig {
  name: string;
  path: string;
  descriptor: PropertyDescriptor;
  type: HttpMethod;
  realtimeUpdate: boolean;
  //#region @backend
  requestHandler: RequestHandler;
  //#endregion
  parameters: { [paramName: string]: ParamConfig } = {};
}


export class ClassConfig {
  singleton: Object = {};
  injections: { getter: Function, propertyName: string; }[] = [];
  basePath: string;
  name: string;
  methods: { [methodName: string]: MethodConfig } = {};
}

import { Response as ExpressResponse, Request as ExpressRequest } from "express";
export type ExpressContext<T> = (req: ExpressRequest, res: ExpressResponse) => T;

export type SyncResponse<T> = string | T;
export type MixResponse<T> = SyncResponse<T> | ExpressContext<T>;

export interface ClientAction<T> {
  received?: PromiseObservableMix<HttpResponse<T>>;
}

export interface __Response<T> {
  send?: MixResponse<T>;
}

export interface AsyncResponse<T> {
  (req?: ExpressRequest, res?: ExpressResponse): Promise<SyncResponse<T>>;
}

export type Response<T=string> = (__Response<T> | AsyncResponse<T>) & ClientAction<T> & __Response<T>;

export class Errors {

  public toString = (): string => {
    return this.message
  }

  private constructor(public message: string, private code: HttpCode = 400) {

  }

  private static create(message: string, code: HttpCode = 400) {
    return new Errors(message, code);
  }

  public static entityNotFound(entity?: Function) {
    return Errors.create(`Entity ${entity.name} not found`);
  }

  public static custom(message: string, code: HttpCode = 400) {
    return Errors.create(message, code);
  }

}

//#region @backend
export interface AuthCallBack {
  (methodReference: Function): RequestHandler;
}
//#endregion
