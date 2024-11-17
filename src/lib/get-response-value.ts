import { Models } from './models';
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import { TaonHelpers } from './helpers/taon-helpers';
import { Helpers } from 'tnp-core/src';

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
        console.error(e);
        console.error('[taon] Error during function call inside controller');
        Helpers.renderError(e);
        reject(e);
      }
    } else {
      reject(`[taon] Not recognized type of response ${response}`);
    }
    //#endregion
  });
  //#endregion
};
