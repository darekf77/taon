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
    const resp: Models.Http.__Response<T> = response;
    if (!response && response.send === undefined) {
      console.error('[taon] Bad response value for function');
      resolve(undefined);
    } else if (typeof response === 'function') {
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
    } else if (typeof response === 'object') {
      try {
        if (typeof response.send === 'function') {
          const result = (response as any).send(req, res) as any;
          resolve(result);
        } else {
          resolve(response.send as any);
        }
      } catch (error) {
        console.error('[taon] Bad synchonus function call ');
        Helpers.renderError(error);
        reject(error);
      }
    } else reject(`[taon] Not recognized type of reposne ${response}`);
    //#endregion
  });
  //#endregion
};
