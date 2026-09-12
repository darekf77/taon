//#region imports
import { Request } from '@cloudflare/workers-types';
import { CoreModels, UtilsHttp } from 'tnp-core/src';

import { corsHeaders } from '../middlewares/cross-origin';
import { parseBody } from '../middlewares/parse-body';
import { parseCookies } from '../middlewares/parse-cookies';
import { Symbols } from '../symbols';

import { createFakeExpressApp } from './cloudflare-express-fake-server';
//#endregion

let initializationPromise: Promise<void> | undefined;

export function createWorkerAdapter(
  fakeExpressApp: ReturnType<typeof createFakeExpressApp>,
  firstRequestCallback: (
    overrideHost: string,
    req?: any,
    res?: any,
    env?: any,
  ) => Promise<void>,
) {
  return async (cloudflareRequest: Request, env: any): Promise<Response> => {
    // console.log('[WORKER] FETCH START');
    const url = new URL(cloudflareRequest.url);

    // --- CORS preflight ---
    if (cloudflareRequest.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(cloudflareRequest),
      });
    }

    //#region parse body
    let parsedBody: any;

    try {
      parsedBody = await parseBody(cloudflareRequest);
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: err?.message || 'Invalid request body',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders(cloudflareRequest),
            'Content-Type': 'application/json',
          },
        },
      );
    }
    //#endregion

    //#region create fake express request
    const headers = Object.fromEntries(cloudflareRequest.headers.entries());

    const fakeExpressRequest: any = {
      method: cloudflareRequest.method,
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
      cookies: parseCookies(cloudflareRequest),

      params: {},

      get(name: string) {
        return cloudflareRequest.headers.get(name) ?? undefined;
      },

      header(name: string) {
        return cloudflareRequest.headers.get(name) ?? undefined;
      },

      accepts(type: string) {
        const accept = cloudflareRequest.headers.get('accept') || '';
        return accept.includes(type);
      },

      is(type: string) {
        const contentType = cloudflareRequest.headers.get('content-type') || '';

        return contentType.includes(type);
      },

      xhr:
        cloudflareRequest.headers.get('x-requested-with')?.toLowerCase() ===
        'xmlhttprequest',

      ip:
        cloudflareRequest.headers.get('cf-connecting-ip') ||
        cloudflareRequest.headers.get('x-forwarded-for') ||
        undefined,

      ips: (() => {
        const value = cloudflareRequest.headers.get('x-forwarded-for') || '';

        return value
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
      })(),

      raw: cloudflareRequest,
    };

    // method override
    if (fakeExpressRequest.body?._method) {
      fakeExpressRequest.method = String(
        fakeExpressRequest.body._method,
      ).toUpperCase();
    }
    //#endregion

    //#region create fake express response
    let status = 200;
    let bodyToSend: any = '';
    let ended = false;
    let resolveResponseFinished!: () => void;

    const responseFinished = new Promise<void>(resolve => {
      resolveResponseFinished = resolve;
    });

    const finishResponse = () => {
      if (ended) {
        return;
      }

      ended = true;
      resolveResponseFinished();
    };

    const resHeaders = new Headers(corsHeaders(cloudflareRequest));

    const fakeExpressResponse: any = {
      locals: {},

      status(code: number) {
        status = code;
        return fakeExpressResponse;
      },

      sendStatus(code: number) {
        status = code;
        bodyToSend = UtilsHttp.getStatusText(code);
        resHeaders.set('content-type', 'text/plain; charset=utf-8');
        finishResponse();
        return fakeExpressResponse;
      },

      setHeader(key: string, value: any) {
        resHeaders.set(key, String(value));
        return fakeExpressResponse;
      },

      getHeader(key: string) {
        return resHeaders.get(key);
      },

      removeHeader(key: string) {
        resHeaders.delete(key);
        return fakeExpressResponse;
      },

      set(key: string | Record<string, any>, value?: any) {
        if (typeof key === 'object') {
          for (const [name, val] of Object.entries(key)) {
            resHeaders.set(name, String(val));
          }
        } else {
          resHeaders.set(key, String(value));
        }

        return fakeExpressResponse;
      },

      header(key: string | Record<string, any>, value?: any) {
        return fakeExpressResponse.set(key as any, value);
      },

      get(key: string) {
        return resHeaders.get(key);
      },

      append(key: string, value: string) {
        resHeaders.append(key, value);
        return fakeExpressResponse;
      },

      type(type: string) {
        resHeaders.set('content-type', UtilsHttp.mimeType(type));
        return fakeExpressResponse;
      },

      json(jsonToParse: any) {
        // if(typeof jsonToParse === 'number' || typeof jsonToParse === )

        bodyToSend = JSON.stringify(jsonToParse);
        // console.log({ jsonToParse, body: bodyToSend });
        resHeaders.set('content-type', 'application/json; charset=utf-8');
        finishResponse();
        return fakeExpressResponse;
      },

      jsonp(data: any) {
        // Not real JSONP unless you intentionally support callback handling.
        return fakeExpressResponse.json(data);
      },

      send(data: any) {
        if (data === undefined || data === null) {
          bodyToSend = '';
        } else if (typeof data === 'string') {
          bodyToSend = data;

          if (!resHeaders.has('content-type')) {
            resHeaders.set('content-type', 'text/html; charset=utf-8');
          }
        } else if (
          data instanceof ArrayBuffer ||
          ArrayBuffer.isView(data) ||
          data instanceof Blob
        ) {
          bodyToSend = data;
        } else {
          bodyToSend = JSON.stringify(data);

          if (!resHeaders.has('content-type')) {
            resHeaders.set('content-type', 'application/json; charset=utf-8');
          }
        }

        finishResponse();
        return fakeExpressResponse;
      },

      end(data?: any) {
        if (data !== undefined) {
          bodyToSend = data;
        }

        finishResponse();
        return fakeExpressResponse;
      },

      redirect(statusOrUrl: number | string, maybeUrl?: string) {
        if (typeof statusOrUrl === 'number') {
          status = statusOrUrl;
          resHeaders.set('Location', maybeUrl || '');
        } else {
          status = 302;
          resHeaders.set('Location', statusOrUrl);
        }

        finishResponse();
        return fakeExpressResponse;
      },

      location(location: string) {
        resHeaders.set('Location', location);
        return fakeExpressResponse;
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

        return fakeExpressResponse;
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

        return fakeExpressResponse;
      },

      // Useful for Taon internals
      get headersSent() {
        return ended;
      },
    };
    //#endregion

    //#region execute fake req/res on taon express layer
    try {
      if (!initializationPromise) {
        initializationPromise = firstRequestCallback(
          new URL(cloudflareRequest.url).origin,
          fakeExpressRequest,
          fakeExpressResponse,
          env,
        ).catch(err => {
          initializationPromise = undefined;
          throw err;
        });
      }

      await initializationPromise;
      await fakeExpressApp(fakeExpressRequest, fakeExpressResponse);

      if (!ended) {
        await responseFinished;
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
      bodyToSend = JSON.stringify({
        error: 'Internal Server Error',
      });

      resHeaders.set('content-type', 'application/json; charset=utf-8');
    }
    //#endregion

    //#region send proper cloudflare response
    // HTTP rules
    if (cloudflareRequest.method === 'HEAD') {
      bodyToSend = null;
    }

    if (status === 204 || status === 304) {
      bodyToSend = null;
    }

    // console.log({ bodyToSend, resHeaders });

    return new Response(bodyToSend, {
      status,
      headers: resHeaders,
    });
    //#endregion
  };
}
