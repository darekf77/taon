type Handler = (req: any, res: any, next?: () => Promise<void>) => any;

export function createFakeExpressApp() {
  const middlewares: Handler[] = [];
  const routes: {
    method: string;
    path: string;
    keys: string[];
    regex: RegExp;
    handler: Handler;
  }[] = [];

  async function runMiddlewares(req: any, res: any) {
    let i = 0;
    const next = async () => {
      if (i < middlewares.length) {
        await middlewares[i++](req, res, next);
      }
    };
    await next();
  }

  const app: any = async (req: any, res: any) => {
    await runMiddlewares(req, res);

    for (const route of routes) {
      if (route.method !== req.method) continue;

      const match = req.path.match(route.regex);
      if (!match) continue;

      req.params = {};
      route.keys.forEach((k, i) => {
        req.params[k] = match[i + 1];
      });

      await route.handler(req, res);
      return;
    }

    res.status(404).json({ error: 'Not Found' });
  };

  app.use = (mw: Handler) => {
    middlewares.push(mw);
  };

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  for (const method of methods) {
    app[method.toLowerCase()] = (path: string, handler: Handler) => {
      const { regex, keys } = compilePath(path);
      routes.push({ method, path, regex, keys, handler });
    };
  }

  return app;
}

function compilePath(path: string) {
  const keys: string[] = [];

  const pattern = path.replace(/:([^/]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });

  return {
    regex: new RegExp(`^${pattern}$`),
    keys,
  };
}
