import { Symbols } from '../symbols';
import { Request } from '@cloudflare/workers-types';
import { CoreModels } from 'tnp-core/src';


export function corsHeaders(
  cloudflareRequest: Request,
): Record<string, string> {
  const origin = cloudflareRequest.headers.get('origin');

  // Same-origin requests often have no Origin header.
  // No CORS headers needed.
  if (!origin) {
    return {};
  }

  const requestOrigin = new URL(cloudflareRequest.url).origin;

  // Same origin -> no CORS needed.
  if (origin === requestOrigin) {
    return {};
  }

  let originUrl: URL;

  try {
    originUrl = new URL(origin);
  } catch {
    return {};
  }

  // Allow localhost on ANY port.
  const isLocalhost =
    originUrl.hostname === 'localhost' ||
    originUrl.hostname === '127.0.0.1' ||
    originUrl.hostname === '[::1]';

  if (!isLocalhost) {
    return {};
  }

  /**
   * During a CORS preflight the browser tells us which headers
   * it wants to send, for example:
   *
   * Access-Control-Request-Headers:
   *   content-type, mhbodyparamsemail
   *
   * Reflect them back instead of maintaining a list of every
   * possible Taon request header.
   */
  const requestedHeaders = cloudflareRequest.headers.get(
    'access-control-request-headers',
  );

  const defaultAllowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
  ].join(', ');

  const exposedHeaders = [
    Symbols.old.X_TOTAL_COUNT,

    Symbols.old.MAPPING_CONFIG_HEADER,
    Symbols.old.CIRCURAL_OBJECTS_MAP_BODY,
    Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM,
  ].join(', ');

  const allowedMethodsString = [
    ...CoreModels.HttpMethodArr.filter(f => f !== 'jsonp').map(c =>
      c.toUpperCase(),
    ),
    'OPTIONS',
  ].join(', ');

  const responseHeaders = {
    // Exact localhost origin, including its port:
    // http://localhost:4200
    // http://localhost:4209
    // etc.
    'Access-Control-Allow-Origin': origin,

    'Access-Control-Allow-Methods': allowedMethodsString,

    // Reflect headers requested by the browser.
    'Access-Control-Allow-Headers':
      requestedHeaders || defaultAllowedHeaders,

    // These are RESPONSE headers that frontend JS is allowed to read.
    'Access-Control-Expose-Headers': exposedHeaders,

    'Access-Control-Allow-Credentials': 'true',

    Vary: 'Origin',
  };

  // console.log({ responseHeaders });

  return responseHeaders;
}
