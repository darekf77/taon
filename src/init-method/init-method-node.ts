import * as _ from 'lodash';

import { Models } from "../models";
import { Helpers } from "../helpers";
import { Global } from '../global-config';
import { Realtime } from '../realtime';
import { SYMBOL } from '../symbols';
//#region @backend
import { walk } from 'lodash-walk-object';
//#endregion

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
      const result = await Helpers.getResponseValue(response, req, res);
      // console.log('result', result)
      if (_.isObject(result)) {
        let cleanedResult = Helpers.JSON.cleaned(result)
        let circural = _.cloneDeep(Helpers.JSON.circural);

        // let i = 0;
        cleanedResult = transformToBrowserVersion(cleanedResult)
        while (true) {
          cleanedResult = Helpers.JSON.cleaned(cleanedResult)
          const nextCircs = _.cloneDeep(Helpers.JSON.circural);
          // console.log(`circs(${++i})`, nextCircs)
          circural = circural.concat(nextCircs);
          if (Helpers.JSON.circural.length === 0) {
            break;
          }
        }

        // console.log('cleaned result', cleanedResult)
        // console.log('circural', circural)
        const entity = Helpers.Mapping.decode(cleanedResult, !Global.vars.isProductionMode);
        res.set(SYMBOL.MAPPING_CONFIG_HEADER, JSON.stringify(entity));
        res.set(SYMBOL.CIRCURAL_OBJECTS_MAP_BODY, JSON.stringify(circural));
        res.json(cleanedResult);
      }
      else {
        res.send(result)
      }
    } catch (error) {
      if (error instanceof Models.Errors) {
        console.log('Morphi Error', error)
        const err: Models.Errors = error;
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
  return {
    routePath: expressPath,
    method: methodConfig.type
  }
}
//#endregion

//#region @backend
function betterError(error) {
  console.log('callsite record !')
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



export function transformToBrowserVersion(json: any) {
  if (!_.isObject(json)) {
    return json;
  }

  const toReplace: { value: any, changeValue: (newValue) => any }[] = []

  walk.Object(json, (value, lodashPath, changeValue) => {
    toReplace.push({ value, changeValue })
  })


  toReplace.forEach(({ value, changeValue }) => {
    let target = Helpers.Class.getFromObject(value);
    let browserTransformFn = getTransformFunction(target);
    if (browserTransformFn) {
      const newValue = browserTransformFn(value)
      changeValue(newValue)
    }
  })

  // console.log('AFTER TRANSFORM', value)
  return json;
}
//#endregion
