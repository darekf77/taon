import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import { Helpers } from 'tnp-core/src';

import { TaonHelpers } from './helpers/taon-helpers';
import { Models } from './models';

export const getResponseValue = <T>(
  response: Models.Http.Response<T>,
  options?: { req: ExpressRequest; res: ExpressResponse },
): Promise<T> => {
  //#region @websqlFunc
  const { req, res } = options || {};
  return new Promise<T>(async (resolve, reject) => {
    //#region @websql

    if (typeof response === 'function') {
      const asyncResponse: Models.Http.AsyncResponse<T> = response as any;
      try {
        const result = await asyncResponse(req, res);
        resolve(result as any);
      } catch (e) {
        reject(e);
      }
    } else {
      reject(`[taon] Not recognized type of response ${response}`);
    }
    //#endregion
  });
  //#endregion
};
