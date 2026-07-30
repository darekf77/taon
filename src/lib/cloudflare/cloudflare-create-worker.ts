import { Request } from './worker-configuration';

/*

What middleware I actuall use in taon ?

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride()); // not sure if needed
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: frontendHost,
  }),
);

// ps these cors header worked pretty well in other clouf flare apps
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

 */

//#region parse body
async function parseBody(request: Request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('form')) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }

  return await request.text();
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
        return [k, decodeURIComponent(v.join('='))];
      }),
  );
}
//#endregion

//#region cors headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*', // or specific domain
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}
//#endregion

//#region create worker adapter
export function createWorkerAdapter(
  handler: (req: any, res: any) => Promise<void> | void,
) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    // --- CORS preflight ---
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // --- req ---
    const req: any = {
      method: request.method,
      url: url.pathname + url.search,
      path: url.pathname,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries()),
      body: await parseBody(request),
      cookies: parseCookies(request),
    };

    // method override (optional)
    if (req.body?._method) {
      req.method = req.body._method.toUpperCase();
    }

    // --- res ---
    let status = 200;
    let body: any = '';
    const resHeaders = new Headers(corsHeaders());

    const res: any = {
      status(code: number) {
        status = code;
        return res;
      },

      setHeader(key: string, value: string) {
        resHeaders.set(key, value);
      },

      getHeader(key: string) {
        return resHeaders.get(key);
      },

      json(data: any) {
        body = JSON.stringify(data);
        resHeaders.set('content-type', 'application/json');
      },

      send(data: any) {
        body = typeof data === 'string' ? data : JSON.stringify(data);
      },

      end(data?: any) {
        if (data !== undefined) body = data;
      },

      sendStatus(code: number) {
        status = code;
        body = String(code);
      },

      redirect(url: string, code = 302) {
        status = code;
        resHeaders.set('Location', url);
      },

      cookie(name: string, value: string, options: any = {}) {
        let cookie = `${name}=${encodeURIComponent(value)}`;

        if (options.httpOnly) cookie += '; HttpOnly';
        if (options.secure) cookie += '; Secure';
        if (options.path) cookie += `; Path=${options.path}`;
        if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
        if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;

        resHeaders.append('Set-Cookie', cookie);
      },

      clearCookie(name: string) {
        resHeaders.append('Set-Cookie', `${name}=; Max-Age=0; Path=/`);
      },
    };

    // --- run handler ---
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error(err);
      status = 500;
      body = JSON.stringify({ error: 'Internal Server Error' });
      resHeaders.set('content-type', 'application/json');
    }

    return new Response(body, {
      status,
      headers: resHeaders,
    });
  };
}
//#endregion
