import {
  ClassConfig, MethodConfig, ParamConfig, ParamType,
  CLASS_META_CONFIG, Response, isNode, isBrowser,
  METHOD_DECORATOR, CLASS_DECORATOR, SOCKET_MSG,
  getExpressPath, GlobalVars, MAPPING_CONFIG_HEADER,
  Errors
} from "./models";
import { HttpMethod } from "ng2-rest";

import { tryTransformParam, getResponseValue } from "./helpers";

declare var require: any;
if (isNode) {
  //#region @backend
  var cors = require('cors');
  var bodyParser = require('body-parser');
  var errorHandler = require('errorhandler');
  var cookieParser = require('cookie-parser')
  var methodOverride = require('method-override');
  var fileUpload = require('express-fileupload');
  var { decode } = require('ng2-rest');
  //#endregion
}


export function initMidleware(global: GlobalVars) {
  //#region @backend
  const { app, socket } = global;
  app.use(fileUpload())
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(cors());

  ((global) => {
    app.use((req, res, next) => {
      res.on('finish', () => {
        // console.log(res.statusCode + ': 1' + req.method);
        const { app, socket } = global;
        const statusCode = res.statusCode;
        const method: HttpMethod = req.method;
        if (method !== 'GET' && !isNaN(statusCode) && statusCode >= 200 && statusCode < 300) {
          const m: MethodConfig = res[METHOD_DECORATOR];
          const c: ClassConfig = res[CLASS_DECORATOR];
          let pathes = Object.keys(c.methods)
            .filter(k => c.methods[k].realtimeUpdate)
            .map(k => getExpressPath(c, c.methods[k].path));
          socket.emit(SOCKET_MSG, {
            method: 'GET',
            pathes
          });
        }

      });

      let allowedHosts = [];
      if (Array.isArray(global.allowedHosts)) {
        allowedHosts = global.allowedHosts.map(h => `${h.href}*`)
      }
      // res.set('Access-Control-Allow-Credentials', true);
      // res.set('Access-Control-Allow-Origin',
      //   [`${global.url.href}*`].concat(allowedHosts).join(', '))
      res.set('Access-Control-Expose-Headers',
        [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          MAPPING_CONFIG_HEADER
        ].join(', '))
      next();
    });
  })(global)
  //#endregion

}


export function initMethodNodejs(
  gb: GlobalVars, type: HttpMethod,
  m: MethodConfig, c: ClassConfig, expressPath) {
  //#region @backendFunc
  const requestHandler = (m.requestHandler && typeof m.requestHandler === 'function')
    ? m.requestHandler : (req, res, next) => { next() };

  gb.url.pathname = gb.url.pathname.replace(/\/$/, "");
  expressPath = gb.url.pathname.startsWith('/') ? `${gb.url.pathname}${expressPath}` : expressPath;
  expressPath = expressPath.replace(/\/\//g, '/')
  // console.log(`expressPath: ${expressPath}`)
  const { app, socket } = gb;
  app[type.toLowerCase()](expressPath, requestHandler, async (req, res) => {
    res[METHOD_DECORATOR] = m;
    res[CLASS_DECORATOR] = c;
    const args: any[] = [];
    Object.keys(m.parameters).forEach(paramName => {
      let p: ParamConfig = m.parameters[paramName];
      if (p.paramType === 'Path' && req.params) {
        args.push(req.params[p.name])
      }
      if (p.paramType === 'Query' && req.query) {
        args.push(req.query[p.name])
      }
      if (p.paramType === 'Header' && req.headers) {
        args.push(req.headers[p.name.toLowerCase()])
      }
      if (p.paramType === 'Cookie' && req.cookies) {
        args.push(req.cookies[p.name])
      }
      if (p.paramType === 'Body' && req.body) {
        if (p.name && typeof req.body === 'object') {
          args.push(req.body[p.name])
        } else {
          args.push(req.body)
        }
      }
    })
    const resolvedParams = args.reverse().map(v => tryTransformParam(v));
    try {
      const response: Response<any> = m.descriptor.value.apply(c.singleton, resolvedParams)
      // console.log('response.send', response.send)

      const result = await getResponseValue(response, req, res);
      // const result = typeof response.send === 'function' ? response.send.call(req, res) : response.send;
      const entity = decode(result, gb.entities);
      res.set(MAPPING_CONFIG_HEADER, JSON.stringify(entity));

      if (typeof result === 'object') {
        res.json(result);
      }
      else res.send(result)
    } catch (error) {
      if (error instanceof Errors) {
        const err: Errors = error;
        res.status(400).send(error)
      } if (error instanceof Error) {
        const err: Error = error;
        res.status(400).send(err.message)
      } else {
        console.log(`Bad result isomorphic method: ${error}`)
        res.status(400).send(error)
      }
    }

  })
  //#endregion
}
