import { Translation } from '@taon-dev/i18n/src';
import { _ } from 'tnp-core/src';

import { Taon } from './index';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export enum HttpStatusEnum {
  /**
   * Code 200.
   * Request completed successfully.
   */
  OK = 'OK',

  /**
   * Code 201.
   * Request succeeded and a new resource was created.
   */
  CREATED = 'CREATED',

  /**
   * Code 202.
   * Request was accepted for processing.
   */
  ACCEPTED = 'ACCEPTED',

  /**
   * Code 204.
   * Request succeeded with no response content.
   */
  NO_CONTENT = 'NO_CONTENT',

  /**
   * Code 301.
   * Resource has been permanently moved to another location.
   */
  MOVED_PERMANENTLY = 'MOVED_PERMANENTLY',

  /**
   * Code 302.
   * Resource is temporarily available at another location.
   */
  FOUND = 'FOUND',

  /**
   * Code 304.
   * Resource has not been modified.
   */
  NOT_MODIFIED = 'NOT_MODIFIED',

  /**
   * Code 400.
   * Request is invalid or malformed.
   */
  BAD_REQUEST = 'BAD_REQUEST',

  /**
   * Code 401.
   * Authentication is required or has failed.
   */
  UNAUTHORIZED = 'UNAUTHORIZED',

  /**
   * Code 401.
   * Authentication token is invalid or expired.
   *
   * Taon-specific status mapped to HTTP 401.
   */
  INVALID_TOKEN = 'INVALID_TOKEN',

  /**
   * Code 401.
   * Authentication token was not provided.
   *
   * Taon-specific status mapped to HTTP 401.
   */
  NO_TOKEN = 'NO_TOKEN',

  /**
   * Code 401.
   * Invalid credentials for login.
   *
   * Taon-specific status mapped to HTTP 401.
   */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  /**
   * Code 403.
   * Request is understood but access is forbidden.
   */
  FORBIDDEN = 'FORBIDDEN',

  /**
   * Code 404.
   * Requested resource was not found.
   */
  NOT_FOUND = 'NOT_FOUND',

  /**
   * Code 409.
   * Request conflicts with the current state of the resource.
   */
  CONFLICT = 'CONFLICT',

  /**
   * Code 422.
   * Request is syntactically valid but cannot be processed.
   */
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',

  /**
   * Code 500.
   * Server encountered an unexpected error.
   */
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  /**
   * Code 502.
   * Server received an invalid response from an upstream server.
   */
  BAD_GATEWAY = 'BAD_GATEWAY',

  /**
   * Code 503.
   * Server is temporarily unavailable.
   */
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export const HttpStatusCodeMap: Record<HttpStatusEnum, number> = {
  [HttpStatusEnum.OK]: 200,
  [HttpStatusEnum.CREATED]: 201,
  [HttpStatusEnum.ACCEPTED]: 202,
  [HttpStatusEnum.NO_CONTENT]: 204,

  [HttpStatusEnum.MOVED_PERMANENTLY]: 301,
  [HttpStatusEnum.FOUND]: 302,
  [HttpStatusEnum.NOT_MODIFIED]: 304,

  [HttpStatusEnum.BAD_REQUEST]: 400,
  [HttpStatusEnum.UNAUTHORIZED]: 401,
  [HttpStatusEnum.INVALID_TOKEN]: 401,
  [HttpStatusEnum.INVALID_CREDENTIALS]: 401,
  [HttpStatusEnum.NO_TOKEN]: 401,
  [HttpStatusEnum.FORBIDDEN]: 403,
  [HttpStatusEnum.NOT_FOUND]: 404,
  [HttpStatusEnum.CONFLICT]: 409,
  [HttpStatusEnum.UNPROCESSABLE_ENTITY]: 422,

  [HttpStatusEnum.INTERNAL_SERVER_ERROR]: 500,
  [HttpStatusEnum.BAD_GATEWAY]: 502,
  [HttpStatusEnum.SERVICE_UNAVAILABLE]: 503,
};

export function getStatusCode(status: HttpStatusEnum): number {
  return HttpStatusCodeMap[status];
}

export const getHttpStatusCodeMessages = (): Record<
  HttpStatusEnum,
  string
> => ({
  [HttpStatusEnum.OK]: t.gettext('OK'),
  [HttpStatusEnum.CREATED]: t.gettext('Created'),
  [HttpStatusEnum.ACCEPTED]: t.gettext('Accepted'),
  [HttpStatusEnum.NO_CONTENT]: t.gettext('No Content'),

  [HttpStatusEnum.MOVED_PERMANENTLY]: t.gettext('Moved Permanently'),
  [HttpStatusEnum.FOUND]: t.gettext('Found'),
  [HttpStatusEnum.NOT_MODIFIED]: t.gettext('Not Modified'),

  [HttpStatusEnum.BAD_REQUEST]: t.gettext('Bad Request'),
  [HttpStatusEnum.UNAUTHORIZED]: t.gettext('Unauthorized'),
  [HttpStatusEnum.INVALID_TOKEN]: t.gettext('Invalid Token'),
  [HttpStatusEnum.NO_TOKEN]: t.gettext('No Token'),
  [HttpStatusEnum.INVALID_CREDENTIALS]: t.gettext('Invalid credentials'),
  [HttpStatusEnum.FORBIDDEN]: t.gettext('Forbidden'),
  [HttpStatusEnum.NOT_FOUND]: t.gettext('Not Found'),
  [HttpStatusEnum.CONFLICT]: t.gettext('Conflict'),
  [HttpStatusEnum.UNPROCESSABLE_ENTITY]: t.gettext('Unprocessable Entity'),

  [HttpStatusEnum.INTERNAL_SERVER_ERROR]: t.gettext('Internal Server Error'),
  [HttpStatusEnum.BAD_GATEWAY]: t.gettext('Bad Gateway'),
  [HttpStatusEnum.SERVICE_UNAVAILABLE]: t.gettext('Service Unavailable'),
});

//#region reverse status code map
export const HttpStatusCodeEnumMap: Record<number, HttpStatusEnum> =
  Object.fromEntries(
    Object.entries(HttpStatusCodeMap).map(([status, code]) => [code, status]),
  ) as Record<number, HttpStatusEnum>;
//#endregion

//#region get status text
export function getStatusText(codeOrStatus: number | HttpStatusEnum): string {
  if (!codeOrStatus) {
    return String(codeOrStatus);
  }

  if (_.isNumber(codeOrStatus)) {
    const status = HttpStatusCodeEnumMap[codeOrStatus];

    if (!status) {
      return String(codeOrStatus);
    }

    return getHttpStatusCodeMessages()[status];
  }

  return getHttpStatusCodeMessages()[codeOrStatus] || String(codeOrStatus);
}
//#endregion
