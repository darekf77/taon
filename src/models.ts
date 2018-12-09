
import { Response, RequestHandler } from "express";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import {
  HttpResponse, HttpCode, PromiseObservableMix,
  ClassConfig, MethodConfig, getClassName
} from "ng2-rest";

import 'rxjs/add/operator/map'
export type ContextENDPOINT = { target: Function; initFN: Function; };

export type FormlyFromType = 'material' | 'bootstrap';





export type ExpressContext<T> = (req: ExpressRequest, res: ExpressResponse) => T;

export type SyncResponse<T> = string | T;
export type MixResponse<T> = SyncResponse<T> | ExpressContext<T>;

export interface ClientAction<T> {
  received?: PromiseObservableMix<HttpResponse<T>>;
}

export interface __Response<T> {
  //#region @backend
  send?: MixResponse<T>;
  //#endregion
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
    return Errors.create(`Entity ${getClassName(entity)} not found`);
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
