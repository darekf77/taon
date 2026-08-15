import { CoreModels } from 'tnp-core/src';
import { Symbols } from '../symbols';
import { Request } from '@cloudflare/workers-types';

//#region parse body
async function parseBody(request: Request) {
  const method = request.method.toUpperCase();

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return undefined;
  }

  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }

  if (contentType.includes('application/json')) {
    const text = await request.text();

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      // Express/body-parser would normally reject malformed JSON.
      throw new SyntaxError('Invalid JSON body');
    }
  }

  const text = await request.text();

  return text || undefined;
}
//#endregion

//#region parse cookies
function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || '';

  return Object.fromEntries(
    cookieHeader
      .split(';')
      .filter(Boolean)
      .map(c => {
        const [k, ...v] = c.trim().split('=');

        let value = v.join('=');

        try {
          value = decodeURIComponent(value);
        } catch {}

        return [k, value];
      }),
  );
}
//#endregion

//#region cors headers
function corsHeaders(request?: Request) {
  const headersAllowedString = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    Symbols.old.X_TOTAL_COUNT,

    Symbols.old.CIRCURAL_OBJECTS_MAP_BODY,
    Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM,

    Symbols.old.MAPPING_CONFIG_HEADER,
    Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS,
    Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS,
  ].join(', ');

  const allowedMethodsString = [
    ...CoreModels.HttpMethodArr.filter(f => f !== 'jsonp').map(c =>
      c.toUpperCase(),
    ),
    'OPTIONS',
  ].join(', ');

  // console.log({ allowedMethodsString, headersAllowedString });

  const origin = request?.headers.get('origin');

  return {
    // IMPORTANT:
    // credentials=true should not be combined with "*"
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': allowedMethodsString,
    'Access-Control-Allow-Headers': headersAllowedString,
    'Access-Control-Expose-Headers': headersAllowedString,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}
//#endregion

//#region helpers
function statusText(code: number) {
  const map: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return map[code] || String(code);
}

function mimeType(type: string) {
  if (type.includes('/')) {
    return type;
  }

  const map: Record<string, string> = {
    json: 'application/json',
    html: 'text/html; charset=utf-8',
    text: 'text/plain; charset=utf-8',
    txt: 'text/plain; charset=utf-8',
    xml: 'application/xml',
    js: 'application/javascript',
    css: 'text/css',
    pdf: 'application/pdf',
  };

  return map[type.toLowerCase()] || type;
}
//#endregion

//#region create worker adapter
let firstRequest = true;

export function createWorkerAdapter(
  handler: (req: any, res: any) => Promise<void> | void,
  firstRequestCallback: (
    overrideHost: string,
    req?: any,
    res?: any,
    env?: any,
  ) => Promise<void>,
) {
  return async (request: Request, env: any): Promise<Response> => {
    console.log('[WORKER] FETCH START');
    const url = new URL(request.url);

    // --- CORS preflight ---
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    let parsedBody: any;

    try {
      parsedBody = await parseBody(request);
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: err?.message || 'Invalid request body',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders(request),
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // --- req ---
    const headers = Object.fromEntries(request.headers.entries());

    const req: any = {
      method: request.method,
      originalUrl: url.pathname + url.search,
      url: url.pathname + url.search,
      path: url.pathname,

      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      host: url.host,

      secure: url.protocol === 'https:',

      headers,
      query: Object.fromEntries(url.searchParams.entries()),
      body: parsedBody,
      cookies: parseCookies(request),

      params: {},

      get(name: string) {
        return request.headers.get(name) ?? undefined;
      },

      header(name: string) {
        return request.headers.get(name) ?? undefined;
      },

      accepts(type: string) {
        const accept = request.headers.get('accept') || '';
        return accept.includes(type);
      },

      is(type: string) {
        const contentType = request.headers.get('content-type') || '';

        return contentType.includes(type);
      },

      xhr:
        request.headers.get('x-requested-with')?.toLowerCase() ===
        'xmlhttprequest',

      ip:
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        undefined,

      ips: (() => {
        const value = request.headers.get('x-forwarded-for') || '';

        return value
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
      })(),

      raw: request,
    };

    // method override
    if (req.body?._method) {
      req.method = String(req.body._method).toUpperCase();
    }

    // --- res ---
    let status = 200;
    let body: any = '';
    let ended = false;

    const resHeaders = new Headers(corsHeaders(request));

    const res: any = {
      locals: {},

      status(code: number) {
        status = code;
        return res;
      },

      sendStatus(code: number) {
        status = code;
        body = statusText(code);
        resHeaders.set('content-type', 'text/plain; charset=utf-8');
        ended = true;
        return res;
      },

      setHeader(key: string, value: any) {
        resHeaders.set(key, String(value));
        return res;
      },

      getHeader(key: string) {
        return resHeaders.get(key);
      },

      removeHeader(key: string) {
        resHeaders.delete(key);
        return res;
      },

      set(key: string | Record<string, any>, value?: any) {
        if (typeof key === 'object') {
          for (const [name, val] of Object.entries(key)) {
            resHeaders.set(name, String(val));
          }
        } else {
          resHeaders.set(key, String(value));
        }

        return res;
      },

      header(key: string | Record<string, any>, value?: any) {
        return res.set(key as any, value);
      },

      get(key: string) {
        return resHeaders.get(key);
      },

      append(key: string, value: string) {
        resHeaders.append(key, value);
        return res;
      },

      type(type: string) {
        resHeaders.set('content-type', mimeType(type));
        return res;
      },

      json(data: any) {
        body = JSON.stringify(data);
        resHeaders.set('content-type', 'application/json; charset=utf-8');
        ended = true;
        return res;
      },

      jsonp(data: any) {
        // Not real JSONP unless you intentionally support callback handling.
        return res.json(data);
      },

      send(data: any) {
        if (data === undefined || data === null) {
          body = '';
        } else if (typeof data === 'string') {
          body = data;

          if (!resHeaders.has('content-type')) {
            resHeaders.set('content-type', 'text/html; charset=utf-8');
          }
        } else if (
          data instanceof ArrayBuffer ||
          ArrayBuffer.isView(data) ||
          data instanceof Blob
        ) {
          body = data;
        } else {
          body = JSON.stringify(data);

          if (!resHeaders.has('content-type')) {
            resHeaders.set('content-type', 'application/json; charset=utf-8');
          }
        }

        ended = true;
        return res;
      },

      end(data?: any) {
        if (data !== undefined) {
          body = data;
        }

        ended = true;
        return res;
      },

      redirect(statusOrUrl: number | string, maybeUrl?: string) {
        if (typeof statusOrUrl === 'number') {
          status = statusOrUrl;
          resHeaders.set('Location', maybeUrl || '');
        } else {
          status = 302;
          resHeaders.set('Location', statusOrUrl);
        }

        ended = true;
        return res;
      },

      location(location: string) {
        resHeaders.set('Location', location);
        return res;
      },

      cookie(name: string, value: string, options: any = {}) {
        let cookie = `${name}=${encodeURIComponent(value)}`;

        if (options.maxAge !== undefined) {
          // Express maxAge is milliseconds.
          cookie += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
        }

        if (options.expires) {
          const expires =
            options.expires instanceof Date
              ? options.expires
              : new Date(options.expires);

          cookie += `; Expires=${expires.toUTCString()}`;
        }

        if (options.domain) {
          cookie += `; Domain=${options.domain}`;
        }

        if (options.path !== undefined) {
          cookie += `; Path=${options.path}`;
        } else {
          cookie += '; Path=/';
        }

        if (options.httpOnly) {
          cookie += '; HttpOnly';
        }

        if (options.secure) {
          cookie += '; Secure';
        }

        if (options.sameSite) {
          const sameSite =
            options.sameSite === true ? 'Strict' : String(options.sameSite);

          cookie += `; SameSite=${sameSite}`;
        }

        resHeaders.append('Set-Cookie', cookie);

        return res;
      },

      clearCookie(name: string, options: any = {}) {
        let cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;

        cookie += `; Path=${options.path || '/'}`;

        if (options.domain) {
          cookie += `; Domain=${options.domain}`;
        }

        if (options.httpOnly) {
          cookie += '; HttpOnly';
        }

        if (options.secure) {
          cookie += '; Secure';
        }

        if (options.sameSite) {
          cookie += `; SameSite=${options.sameSite}`;
        }

        resHeaders.append('Set-Cookie', cookie);

        return res;
      },

      // Useful for Taon internals
      get headersSent() {
        return ended;
      },
    };

    try {
      if (firstRequest) {
        firstRequest = false;
        await firstRequestCallback(request.url, req, res, env);
      } else {
        await handler(req, res);
      }
    } catch (err: any) {
      console.log(err);
      console.error('BACKEND ERROR', {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        cause: err?.cause,
      });

      status = 500;
      body = JSON.stringify({
        error: 'Internal Server Error',
      });

      resHeaders.set('content-type', 'application/json; charset=utf-8');
    }

    // HTTP rules
    if (request.method === 'HEAD') {
      body = null;
    }

    if (status === 204 || status === 304) {
      body = null;
    }

    return new Response(body, {
      status,
      headers: resHeaders,
    });
  };
}
//#endregion
