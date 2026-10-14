import type { Request, Response } from 'express';

export type ExpressResponse<T = any> = Response<T>;

export type ExpressRequest<T = any> = Request<T> & { userId: number | string };
