// import { Request } from './worker-configuration';

// async function parseBody(request: Request) {
//   const contentType = request.headers.get('content-type') || '';

//   if (contentType.includes('application/json')) {
//     return await request.json();
//   }

//   if (contentType.includes('form')) {
//     const form = await request.formData();
//     return Object.fromEntries(form.entries());
//   }

//   return await request.text();
// }

// function parseCookies(request: Request): Record<string, string> {
//   const cookieHeader = request.headers.get('cookie') || '';
//   return Object.fromEntries(
//     cookieHeader
//       .split(';')
//       .filter(Boolean)
//       .map(c => {
//         const [k, ...v] = c.trim().split('=');
//         return [k, decodeURIComponent(v.join('='))];
//       }),
//   );
// }

// /*

// What middleware I actuall use in taon ?

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
// app.use(methodOverride()); // not sure if needed
// app.use(cookieParser());
// app.use(
//   cors({
//     credentials: true,
//     origin: frontendHost,
//   }),
// );

// // ps these cors header worked pretty well in other clouf flare apps
// function corsHeaders() {
//   return {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
//     'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//   };
// }

//  */

// export function createWorkerAdapter(
//   handler: (req: any, res: any) => Promise<void> | void,
// ) {
//   return async (request: Request): Promise<Response> => {
//     const url = new URL(request.url);

//     // fake req
//     const req: any = {
//       method: request.method,
//       url: url.pathname + url.search,
//       headers: Object.fromEntries(request.headers.entries()),
//       query: Object.fromEntries(url.searchParams.entries()),
//       body: await parseBody(request),
//     };

//     req.cookies = parseCookies(request);

//     // response builder
//     let status = 200;
//     let headers: Record<string, string> = {};
//     let body: any;

//     const res: any = {
//       status(code: number) {
//         status = code;
//         return res;
//       },
//       setHeader(key: string, value: string) {
//         headers[key] = value;
//       },
//       json(data: any) {
//         body = JSON.stringify(data);
//         headers['content-type'] = 'application/json';
//       },
//       send(data: any) {
//         body = data;
//       },
//       end(data?: any) {
//         body = data ?? body;
//       },
//     };

//     await handler(req, res);

//     return new Response(body, {
//       status,
//       headers,
//     });
//   };
// }

// type Handler = (req: any, res: any, next?: () => Promise<void>) => any;

// export function createFakeExpressApp() {
//   const middlewares: Handler[] = [];
//   const routes: {
//     method: string;
//     path: string;
//     handler: Handler;
//   }[] = [];

//   function matchPath(routePath: string, urlPath: string) {
//     return routePath === urlPath; // simple for now
//   }

//   async function runMiddlewares(req: any, res: any) {
//     let i = 0;
//     const next = async () => {
//       if (i < middlewares.length) {
//         await middlewares[i++](req, res, next);
//       }
//     };
//     await next();
//   }

//   const app: any = async (req: any, res: any) => {
//     await runMiddlewares(req, res);

//     const route = routes.find(
//       r => r.method === req.method && matchPath(r.path, req.url.split('?')[0]),
//     );

//     if (!route) {
//       res.status(404).json({ error: 'Not Found' });
//       return;
//     }

//     await route.handler(req, res);
//   };

//   app.use = (mw: Handler) => {
//     middlewares.push(mw);
//   };

//   app.get = (path: string, handler: Handler) => {
//     routes.push({ method: 'GET', path, handler });
//   };

//   app.post = (path: string, handler: Handler) => {
//     routes.push({ method: 'POST', path, handler });
//   };

//   app.put = (path: string, handler: Handler) => {
//     routes.push({ method: 'PUT', path, handler });
//   };

//   // do also for others (maybe in loop for each http method ?)

//   return app;
// }

// const app =
//   createFakeExpressApp();
//   /* probably some kind of parameter can be here form taon
// {
//   frontendHost: string,
// }
//   */

// // middleware
// app.use(async (req, res, next) => {
//   console.log('Incoming:', req.method, req.url);
//   await next?.();
// });

// // GET
// app.get('/hello', async (req, res) => {
//   res.json({
//     message: 'Hello from Worker!',
//     query: req.query,
//   });
// });

// // probabl provide some more exmaples

// export { app };

// /* ps. currenlty I am using

// import { createWorkerAdapter, app } from '../../../../../../src/app.cloudflare';

// export default {
//   fetch: createWorkerAdapter(app), // probably can be resused
// };


// // like this
// const serverHandler = createWorkerAdapter(app)
// export default {
//   fetch: serverHandler, // or something similar...
// };


// */
