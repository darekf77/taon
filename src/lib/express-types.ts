import type { Request, Response, NextFunction, RequestHandler } from 'express';

export type ExpressResponse<T = any> = Response<T>;

export type ExpressRequest<T = any> = Request<T> & {
  userId: number | string;
  sessionId: number | string;
};

export type ExpressNextFunction = NextFunction;

export type ExpressRequestHandler = RequestHandler;
