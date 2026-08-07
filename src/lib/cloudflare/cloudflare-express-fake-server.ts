import type { Application } from 'express';
import { CoreModels } from 'tnp-core/src';


type NextFunction = () => Promise<void>;

type Handler = (req: any, res: any, next?: NextFunction) => any | Promise<any>;

interface MiddlewareEntry {
  path?: string;
  handler: Handler;
}

interface RouteEntry {
  method: string;
  path: string;
  keys: string[];
  regex: RegExp;
  handlers: Handler[];
}

export function createFakeExpressApp(fakeServerOpt?: {
  debugRoutes?: boolean;
}): Application {
  fakeServerOpt = fakeServerOpt || {};
  const middlewares: MiddlewareEntry[] = [];
  const routes: RouteEntry[] = [];

  const app: any = async (req: any, res: any) => {
    const route = routes.find(route => {
      return (
        route.method === req.method.toUpperCase() && route.regex.test(req.path)
      );
    });

    const handlers: Handler[] = [];

    for (const middleware of middlewares) {
      if (
        !middleware.path ||
        matchesMiddlewarePath(req.path, middleware.path)
      ) {
        handlers.push(middleware.handler);
      }
    }

    if (route) {
      const match = req.path.match(route.regex);

      req.params = {};

      if (match) {
        route.keys.forEach((key, index) => {
          req.params[key] = decodeURIComponent(match[index + 1]);
        });
      }

      handlers.push(...route.handlers);
    } else {
      handlers.push((_req, response) => {
        response.status(404).json({
          error: 'Not Found',
        });
      });
    }

    await runHandlers(handlers, req, res);
  };

  app.use = (pathOrHandler: string | Handler, ...handlers: Handler[]) => {
    if (typeof pathOrHandler === 'function') {
      fakeServerOpt.debugRoutes &&
        console.log(`[fake-express] use(*) x${1 + handlers.length}`);

      middlewares.push({
        handler: pathOrHandler,
      });

      for (const handler of handlers) {
        middlewares.push({
          handler,
        });
      }

      return app;
    }

    fakeServerOpt.debugRoutes &&
      console.log(
        `[fake-express] use(${normalizePath(pathOrHandler)}) x${handlers.length}`,
      );

    for (const handler of handlers) {
      middlewares.push({
        path: normalizePath(pathOrHandler),
        handler,
      });
    }

    return app;
  };

  const methods = CoreModels.HttpMethodArr.filter(
    method => method !== 'jsonp',
  ).map(method => method.toUpperCase());

  for (const method of methods) {
    app[method.toLowerCase()] = (path: string, ...handlers: Handler[]) => {
      if (handlers.length === 0) {
        throw new Error(
          `At least one handler is required for ${method} ${path}`,
        );
      }

      const { regex, keys } = compilePath(path);

      if (fakeServerOpt.debugRoutes) {
        console.log(
          `[fake-express] ${method.padEnd(7)} ${path} (${handlers.length} handler${handlers.length === 1 ? '' : 's'})`,
        );
      }

      routes.push({
        method,
        path,
        regex,
        keys,
        handlers,
      });

      return app;
    };
  }

  return app;
}

async function runHandlers(
  handlers: Handler[],
  req: any,
  res: any,
): Promise<void> {
  let currentIndex = -1;

  const dispatch = async (index: number): Promise<void> => {
    if (index <= currentIndex) {
      throw new Error('next() called multiple times');
    }

    currentIndex = index;

    const handler = handlers[index];

    if (!handler) {
      return;
    }

    let nextCalled = false;

    const next: NextFunction = async () => {
      if (nextCalled) {
        throw new Error('next() called multiple times');
      }

      nextCalled = true;
      await dispatch(index + 1);
    };

    await handler(req, res, next);
  };

  await dispatch(0);
}

function matchesMiddlewarePath(
  requestPath: string,
  middlewarePath: string,
): boolean {
  if (middlewarePath === '/') {
    return true;
  }

  return (
    requestPath === middlewarePath ||
    requestPath.startsWith(`${middlewarePath}/`)
  );
}

function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function compilePath(path: string) {
  const keys: string[] = [];

  const pattern = path
    .split('/')
    .map(segment => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }

      return escapeRegex(segment);
    })
    .join('/');

  return {
    regex: new RegExp(`^${pattern}/?$`),
    keys,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
