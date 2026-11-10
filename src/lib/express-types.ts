import type { Request, Response, NextFunction, RequestHandler } from 'express';

export type ExpressResponse<T = any> = Response<T>;

export type ExpressRequest<T = any> = Request<T> & {
  /**
   * @taon-dev/session userId
   *
   * when userId = 9007199254740991 (Number.MAX_SAFE_INTEGER) mean you are using
   * localhost root mode (ctx.isLocalhostBackend === true)
   */
  userId: number | string;
  /**
   * @taon-dev/session sessionid
   */
  sessionId: number | string;
  /**
   * rawBody needed for stripe request verifiction
   */
  rawBody?: Uint8Array;
  /**
   * Raw cloudflare request
   */
  raw?: globalThis.Request;
};

export type ExpressNextFunction = NextFunction;

export type ExpressRequestHandler = RequestHandler;
