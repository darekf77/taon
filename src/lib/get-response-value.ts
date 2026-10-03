import { Helpers } from 'tnp-core/src';

import { ExpressRequest, ExpressResponse } from './express-types';
import { TaonHelpers } from './helpers/taon-helpers';
import { Models } from './models';

export const getResponseValue = <T>(
  response: Models.Http.Response<T>,
  options?: {
    req: ExpressRequest<any>;
    res: ExpressResponse<any>;
    results: Models.Http.RequestResults;
  },
): Promise<T> => {
  //#region @websqlFunc
  const { req, res, results } = options || {};
  return new Promise<T>(async (resolve, reject) => {
    //#region @websql

    if (typeof response === 'function') {
      const asyncResponse: Models.Http.AsyncResponse<T> = response as any;
      try {
        const result = await asyncResponse(req, res, results);
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
