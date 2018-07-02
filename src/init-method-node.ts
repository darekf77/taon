import {
  Response, Errors
} from "./models";
import {
  ClassConfig,
  MethodConfig,
  ParamConfig,
  HttpMethod,
  //#region @backend
  decode
  //#endregion
} from "ng2-rest";
import { tryTransformParam, getResponseValue } from "./helpers";
import { Global } from './global-config';
import { Realtime } from './realtime';
import { SYMBOL } from './symbols';

//#region @backend
import * as  cors from 'cors';
import * as bodyParser from 'body-parser';
import * as errorHandler from 'errorhandler';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as fileUpload from 'express-fileupload';
//#endregion


export function initMidleware() {
  //#region @backend
  const app = Global.vars.app;
  app.use(fileUpload())
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(cors());

  (() => {
    app.use((req, res, next) => {

      Realtime.nodejs.request(req, res);

      res.set('Access-Control-Expose-Headers',
        [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          SYMBOL.MAPPING_CONFIG_HEADER
        ].join(', '))
      next();
    });
  })()
  //#endregion

}


export function initMethodNodejs(
  type: HttpMethod,
  methodConfig: MethodConfig,
  classConfig: ClassConfig,
  expressPath
) {

  //#region @backendFunc
  const requestHandler = (methodConfig.requestHandler && typeof methodConfig.requestHandler === 'function')
    ? methodConfig.requestHandler : (req, res, next) => { next() };

  Global.vars.url.pathname = Global.vars.url.pathname.replace(/\/$/, "");
  expressPath = Global.vars.url.pathname.startsWith('/') ? `${Global.vars.url.pathname}${expressPath}` : expressPath;
  expressPath = expressPath.replace(/\/\//g, '/')
  console.log(`BACKEND: expressPath: ${expressPath}`)

  Global.vars.app[type.toLowerCase()](expressPath, requestHandler, async (req, res) => {
    res[SYMBOL.METHOD_DECORATOR] = methodConfig;
    res[SYMBOL.CLASS_DECORATOR] = classConfig;
    const args: any[] = [];
    Object.keys(methodConfig.parameters).forEach(paramName => {
      let p: ParamConfig = methodConfig.parameters[paramName];
      if (p.paramType === 'Path' && req.params) {
        args.push(req.params[p.paramName])
      }
      if (p.paramType === 'Query' && req.query) {
        args.push(req.query[p.paramName])
      }
      if (p.paramType === 'Header' && req.headers) {
        args.push(req.headers[p.paramName.toLowerCase()])
      }
      if (p.paramType === 'Cookie' && req.cookies) {
        args.push(req.cookies[p.paramName])
      }
      if (p.paramType === 'Body' && req.body) {
        if (p.paramName && typeof req.body === 'object') {
          args.push(req.body[p.paramName])
        } else {
          args.push(req.body)
        }
      }
    })
    const resolvedParams = args.reverse().map(v => tryTransformParam(v));
    try {
      const response: Response<any> = methodConfig.descriptor.value.apply(classConfig.singleton, resolvedParams)
      // console.log('response.send', response.send)

      const result = await getResponseValue(response, req, res);
      // const result = typeof response.send === 'function' ? response.send.call(req, res) : response.send;
      const entity = decode(result);
      res.set(SYMBOL.MAPPING_CONFIG_HEADER, JSON.stringify(entity));

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
