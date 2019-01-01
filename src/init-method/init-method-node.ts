import * as _ from 'lodash';

import { Models } from "../models";
import { Helpers } from "../helpers";
import { Global } from '../global-config';
import { Realtime } from '../realtime';
import { SYMBOL } from '../symbols';

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
          SYMBOL.X_TOTAL_COUNT,
          SYMBOL.MAPPING_CONFIG_HEADER,
          SYMBOL.CIRCURAL_OBJECTS_MAP_BODY,
          SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM
        ].join(', '))
      next();
    });
  })()
  //#endregion

}

//#region @backend
export function initMethodNodejs(
  type: Models.Rest.HttpMethod,
  methodConfig: Models.Rest.MethodConfig,
  classConfig: Models.Rest.ClassConfig,
  expressPath
) {


  const requestHandler = (methodConfig.requestHandler && typeof methodConfig.requestHandler === 'function')
    ? methodConfig.requestHandler : (req, res, next) => { next() };

  const productionMode = Global.vars.productionMode;
  Global.vars.url.pathname = Global.vars.url.pathname.replace(/\/$/, "");
  expressPath = Global.vars.url.pathname.startsWith('/') ? `${Global.vars.url.pathname}${expressPath}` : expressPath;
  expressPath = expressPath.replace(/\/\//g, '/')
  // console.log(`BACKEND: expressPath: ${expressPath}`)

  Global.vars.app[type.toLowerCase()](expressPath, requestHandler, async (req, res) => {

    res[SYMBOL.METHOD_DECORATOR] = methodConfig;
    res[SYMBOL.CLASS_DECORATOR] = classConfig;
    const args: any[] = [];

    let tBody = req.body;
    let tParams = req.params;
    let tQuery = req.query;

    if (req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_BODY]) {
      try {
        tBody = Helpers.JSON.parse(JSON.stringify(tBody), JSON.parse(req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_BODY]));
      } catch (e) { }
    }

    if (req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]) {
      try {
        tQuery = Helpers.JSON.parse(JSON.stringify(tQuery), JSON.parse(req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]));
      } catch (e) { }
    }

    // make class instance from body
    // console.log('req.headers', req.headers)
    if (req.headers[SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS]) {
      try {
        const entity = JSON.parse(req.headers[SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS]);
        tBody = Helpers.Mapping.encode(tBody, entity);
      } catch (e) { }
    } else {
      Object.keys(tBody).forEach(paramName => {
        try {
          const entityForParam = JSON.parse(req.headers[`${SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS}${paramName}`]);
          tBody[paramName] = Helpers.Mapping.encode(tBody[paramName], entityForParam);
        } catch (e) { }
      })
    }

    // make class instance from query params
    // console.log('req.headers', tQuery)
    if (req.headers[SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS]) {
      try {
        const entity = JSON.parse(req.headers[SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS]);
        tQuery = Helpers.parseJSONwithStringJSONs(Helpers.Mapping.encode(tQuery, entity));
      } catch (e) { }
    } else {
      Object.keys(tQuery).forEach(queryParamName => {
        try {
          const entityForParam = JSON.parse(req.headers[`${SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${queryParamName}`]);
          tQuery[queryParamName] = Helpers.parseJSONwithStringJSONs(Helpers.Mapping.encode(tQuery[queryParamName], entityForParam));
        } catch (e) { }
      });
    }

    Object.keys(methodConfig.parameters).forEach(paramName => {
      let p: Models.Rest.ParamConfig = methodConfig.parameters[paramName];
      if (p.paramType === 'Path' && tParams) {
        args.push(tParams[p.paramName])
      }
      if (p.paramType === 'Query' && tQuery) {
        if (p.paramName) {
          args.push(tQuery[p.paramName])
        } else {
          args.push(tQuery);
        }
      }

      if (p.paramType === 'Header' && req.headers) {
        args.push(req.headers[p.paramName.toLowerCase()])
      }
      if (p.paramType === 'Cookie' && req.cookies) {
        args.push(req.cookies[p.paramName])
      }
      if (p.paramType === 'Body' && tBody) {
        if (p.paramName && typeof tBody === 'object') {
          args.push(tBody[p.paramName])
        } else {
          args.push(tBody)
        }
      }
    })
    const resolvedParams = args.reverse().map(v => Helpers.tryTransformParam(v));
    try {
      const response: Models.Response<any> = methodConfig.descriptor.value.apply(classConfig.singleton, resolvedParams)
      // console.log('response.send', response.send)

      let result = await Helpers.getResponseValue(response, req, res);
      // console.log('result', result)

      if (_.isObject(result)) {
        const cleanedResult = Helpers.JSON.cleaned(result)
        // console.log(cleanedResult)
        const entity = Helpers.Mapping.decode(cleanedResult, { productionMode });
        res.set(SYMBOL.MAPPING_CONFIG_HEADER, JSON.stringify(entity));
      } else {
        // console.log('is not a object?', result)
      }

      // const result = typeof response.send === 'function' ? response.send.call(req, res) : response.send;

      if (typeof result === 'object') {
        const s = Helpers.JSON.stringify(result)
        result = Helpers.JSON.parse(s);
        res.set(SYMBOL.CIRCURAL_OBJECTS_MAP_BODY, JSON.stringify(Helpers.JSON.circural));
        res.json(transformToBrowserVersion(result));
      }
      else res.send(transformToBrowserVersion(result))
    } catch (error) {
      if (error instanceof Models.Errors) {
        const err: Models.Errors = error;
        console.log('aaaaaaaaaaaaa', err)
        res.status(400).send(Helpers.JSON.stringify(err))
      } if (error instanceof Error) {
        const err: Error = error;
        betterError(err)
        res.status(400).send(Helpers.JSON.stringify({
          stack: err.stack,
          message: err.message
        }))
      } else {
        console.log(`Bad result isomorphic method: ${error}`)
        res.status(400).send(Helpers.JSON.stringify(error))
      }
    }

  })

}
//#endregion

//#region @backend
function betterError(error) {
  require('callsite-record')({
    forError: error
  }).renderSync({
    stackFilter(frame) {
      return !frame.getFileName().includes('node_modules');
    }
  });
}
//#endregion

//#region @backend

export function getTransformFunction(target: Function) {
  if (!target) {
    return;
  }
  const configs = Helpers.Class.getConfig(target);
  // console.log(`CONFIGS TO CHECK`, configs)
  const functions = configs
    .map(c => {
      if (_.isFunction(c.browserTransformFn)) {
        return c.browserTransformFn;
      }
    })
    .filter(f => !!f);
  return _.first(functions);
}

export function transformToBrowserVersion(value: any) {
  if (!_.isObject(value)) {
    return value;
  }
  Helpers.walkObject(value, (lodashPath) => {
    let v = _.get(value, lodashPath);
    let target = Helpers.Class.getFromObject(v);
    let browserTransformFn = getTransformFunction(target);
    if (Helpers.Class.getName(target) === 'Array') {
      console.log('BAD!!!!!!', target)
    }
    // console.log(`for ${lodashPath} , target ${target}`)
    if (browserTransformFn) {
      console.log('transform function works !', browserTransformFn)
      _.set(v, lodashPath, browserTransformFn(v));
    }
  })
  // console.log('AFTER TRANSFORM', value)
  return value;
}
//#endregion
