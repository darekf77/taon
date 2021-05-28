import { _ } from 'tnp-core';
import { Models } from '../models';
import { MorphiHelpers as Helpers } from '../helpers';
import { SYMBOL } from '../symbols';
import { EntityProcess } from './entity-process';
import { MDC } from '../crud';
import { FrameworkContext } from '../framework/framework-context';

export function initMethodNodejs(
  type: Models.Rest.HttpMethod,
  methodConfig: Models.Rest.MethodConfig,
  classConfig: Models.Rest.ClassConfig,
  expressPath: string,
  target: Function
) {

  const requestHandler = (methodConfig.requestHandler && typeof methodConfig.requestHandler === 'function')
    ? methodConfig.requestHandler : (req, res, next) => { next() };

  const productionMode = FrameworkContext.isProductionMode;
  const context = FrameworkContext.findForTraget(target);
  const url = context.uri;

  url.pathname = url.pathname.replace(/\/$/, '');
  expressPath = url.pathname.startsWith('/') ? `${url.pathname}${expressPath}` : expressPath;
  expressPath = expressPath.replace(/\/\//g, '/')
  // console.log(`BACKEND: expressPath: ${expressPath}`)
  if (!context.onlyForBackendRemoteServerAccess) {
    context.node.app[type.toLowerCase()](expressPath, requestHandler, async (req, res) => {

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
            let beforeTransofrm = tQuery[queryParamName];
            if (_.isString(beforeTransofrm)) {
              try {
                const paresed = Helpers.tryTransformParam(beforeTransofrm)
                beforeTransofrm = paresed;
              } catch (e) { }
            }
            const afterEncoding = Helpers.Mapping.encode(beforeTransofrm, entityForParam);
            tQuery[queryParamName] = Helpers.parseJSONwithStringJSONs(afterEncoding);
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

        const response: Models.Response<any> = methodConfig.descriptor.value.apply(
          /**
           * Context for method @GET,@PUT etc.
           */
          context.getInstance(target),
          /**
           * Params for metjod @GET, @PUT etc.
           */
          resolvedParams
        );
        let result = await Helpers.getResponseValue(response, req, res);
        // console.log(req.headers)
        const mdc = MDC.fromHeader(req);
        // console.log(mdc)
        await EntityProcess.init(result, res, mdc);

      } catch (error) {
        if (_.isString(error)) {
          res.status(400).send(Helpers.JSON.stringify({
            message: `
  Error inside: ${req.path}

  ${error}

  `
          }))
        } else if (error instanceof Models.Errors) {
          console.log('Morphi Error', error)
          const err: Models.Errors = error;
          res.status(400).send(Helpers.JSON.stringify(err))
        } else if (error instanceof Error) {
          const err: Error = error;
          console.log('Code Error', error)
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

  return {
    routePath: expressPath,
    method: methodConfig.type
  }
}

function betterError(error) {
  console.log(require('callsite-record')({
    forError: error
  }).renderSync({
    // stackFilter(frame) {
    //   return !frame.getFileName().includes('node_modules');
    // }
  }))
}
