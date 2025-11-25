//#region imports
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  AxiosTaonHttpHandler,
  TaonClientMiddlewareInterceptOptions,
  TaonServerMiddlewareInterceptOptions,
} from 'ng2-rest/src';
import { Observable } from 'rxjs';
import { CoreModels } from 'tnp-core/src';

import { TaonBaseInjector } from './base-injector';
//#endregion

/**
 * TODO
 * - global provider available in all contexts
 * - provider available in own context
 */
export abstract class TaonBaseMiddleware extends TaonBaseInjector {}

export interface TaonAdditionalMiddlewareMethodInfo {
  methodName: string;
  expressPath: string;
  httpRequestType: CoreModels.HttpMethod;
}

export interface TaonBaseMiddleware {
  /**
   * Global interceptor for whole context
   * backend request
   */
  interceptServer({
    req,
    res,
    next,
  }: TaonServerMiddlewareInterceptOptions): Promise<void> | void;

  /**
   * Global interceptor for whole context
   * client requests
   */
  interceptClient({
    req,
    next,
  }: TaonClientMiddlewareInterceptOptions): Observable<AxiosResponse<any>>;

  /**
   * Specyfic controller method interceptor
   */
  interceptServerMethod(
    { req, res, next }: TaonServerMiddlewareInterceptOptions,
    {
      methodName,
      expressPath,
      httpRequestType,
    }: TaonAdditionalMiddlewareMethodInfo,
  ): Promise<void> | void;

  /**
   * Controller method frontned interceptor
   * TODO not needed ?
   */
  interceptClientMethod(
    { req, next }: TaonClientMiddlewareInterceptOptions,
    {
      methodName,
      expressPath,
      httpRequestType,
    }: TaonAdditionalMiddlewareMethodInfo,
  ): Observable<AxiosResponse<any>>;
}
