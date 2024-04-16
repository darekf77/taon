//#region @websql
//#region imports
import { Helpers, _ } from 'tnp-core/src';
import { Models } from '../models';
import { FiredevHelpers } from '../helpers';
import { SYMBOL } from '../symbols';
import { EntityProcess } from './entity-process';
import { FrameworkContext } from '../framework/framework-context';
import { Models as ModelsNg2Rest } from 'ng2-rest/src';
//#region @backend
import { Blob } from 'buffer';
//#endregion
//#endregion

// TODO below thing needs to be there
// @ts-ignore
export function initMethodNodejs(
  //#region parameters
  type: Models.Rest.HttpMethod,
  methodConfig: Models.Rest.MethodConfig,
  classConfig: Models.Rest.ClassConfig,
  expressPath: string,
  target: Function
  //#endregion
): any {

  //#region resolve variables
  const requestHandler = (methodConfig.requestHandler && typeof methodConfig.requestHandler === 'function')
    ? methodConfig.requestHandler : (req, res, next) => { next() };

  const context = FrameworkContext.findForTraget(target);
  const url = context.uri;

  url.pathname = url.pathname.replace(/\/$/, '');
  expressPath = url.pathname.startsWith('/') ? `${url.pathname}${expressPath}` : expressPath;
  expressPath = expressPath.replace(/\/\//g, '/')
  // console.log(`BACKEND: expressPath: ${expressPath}`)
  //#endregion

  //#region handle websql request mode
  //#region @websqlOnly
  if (!context.node.app) {
    // @ts-ignore
    context.node.app = {}
  }
  //#endregion
  //#endregion

  if (!context.onlyForBackendRemoteServerAccess) {

    //#region apply dummy websql express routers
    //#region @websql
    if (!context.node.app[type.toLowerCase()]) {
      context.node.app[type.toLowerCase()] = () => { }
    }

    //#region @backend
    if (!Helpers.isRunningIn.cliMode()) {
      //#endregion
      console.log(`[${type.toUpperCase()}] ${expressPath}`);
      //#region @backend
    }
    //#endregion

    //#endregion
    //#endregion

    context.node.app[type.toLowerCase()](expressPath, requestHandler, async (req, res) => {

      //#region process params
      const args: any[] = [];

      let tBody = req.body;
      let tParams = req.params;
      let tQuery = req.query;

      if (req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_BODY]) {
        try {
          tBody = FiredevHelpers.JSON.parse(JSON.stringify(tBody), JSON.parse(req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_BODY]));
        } catch (e) { }
      }

      if (req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]) {
        try {
          tQuery = FiredevHelpers.JSON.parse(JSON.stringify(tQuery), JSON.parse(req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]));
        } catch (e) { }
      }

      // make class instance from body
      // console.log('req.headers', req.headers)
      if (req.headers[SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS]) {
        try {
          const entity = JSON.parse(req.headers[SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS]);
          tBody = FiredevHelpers.Mapping.encode(tBody, entity);
        } catch (e) { }
      } else {
        Object.keys(tBody).forEach(paramName => {
          try {
            const entityForParam = JSON.parse(req.headers[`${SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS}${paramName}`]);
            tBody[paramName] = FiredevHelpers.Mapping.encode(tBody[paramName], entityForParam);
          } catch (e) { }
        })
      }

      // make class instance from query params
      // console.log('req.headers', tQuery)
      if (req.headers[SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS]) {

        try {
          const entity = JSON.parse(req.headers[SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS]);
          tQuery = FiredevHelpers.parseJSONwithStringJSONs(FiredevHelpers.Mapping.encode(tQuery, entity));
        } catch (e) { }
      } else {
        Object.keys(tQuery).forEach(queryParamName => {
          try {
            const entityForParam = JSON.parse(req.headers[`${SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${queryParamName}`]);
            let beforeTransofrm = tQuery[queryParamName];
            if (_.isString(beforeTransofrm)) {
              try {
                const paresed = FiredevHelpers.tryTransformParam(beforeTransofrm)
                beforeTransofrm = paresed;
              } catch (e) { }
            }
            const afterEncoding = FiredevHelpers.Mapping.encode(beforeTransofrm, entityForParam);
            tQuery[queryParamName] = FiredevHelpers.parseJSONwithStringJSONs(afterEncoding);
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
      //#endregion

      const resolvedParams = args.reverse().map(v => FiredevHelpers.tryTransformParam(v));

      try {
        const response: Models.Response<any> = methodConfig.descriptor.value.apply(
          /**
           * Context for method @GET,@PUT etc.
           */
          context.getInstanceBy(target),
          /**
           * Params for metjod @GET, @PUT etc.
           */
          resolvedParams
        );
        let result = await FiredevHelpers.getResponseValue(response, { req, res });

        if (result instanceof Blob && (methodConfig.responseType as ModelsNg2Rest.ResponseTypeAxios) === 'blob') {
          console.log('INSTANCE OF BLOB')
          //#region processs blob result type
          const blob = result as Blob;
          const file = Buffer.from(await blob.arrayBuffer());
          res.writeHead(200, {
            'Content-Type': blob.type,
            'Content-Length': file.length
          });
          res.end(file);
          //#endregion
        } else if (_.isString(result) && (methodConfig.responseType as ModelsNg2Rest.ResponseTypeAxios) === 'blob') {
          console.log('BASE64')
          //#region process string buffer TODO refacetor
          const img_base64 = result;
          const m = /^data:(.+?);base64,(.+)$/.exec(img_base64)
          if (!m) {
            throw new Error(`[firedev-framework] Not a base64 image [${img_base64}]`)
          }
          const [_, content_type, file_base64] = m
          const file = Buffer.from(file_base64, 'base64')

          res.writeHead(200, {
            'Content-Type': content_type,
            'Content-Length': file.length
          });
          res.end(file);
          //#endregion
        } else {
          //#region process json request
          // console.log('REQUEST RESULT', result)
          await EntityProcess.init(result, res);
          //#endregion
        }
      } catch (error) {
        //#region process error
        if (_.isString(error)) {
          res.status(400).send(FiredevHelpers.JSON.stringify({
            message: `
  Error inside: ${req.path}

  ${error}

  `
          }))
        } else if (error instanceof Models.Errors) {
          Helpers.error(error, true, false)
          const err: Models.Errors = error;
          res.status(400).send(FiredevHelpers.JSON.stringify(err))
        } else if (error instanceof Error) {
          const err: Error = error;
          Helpers.error(error, true, false)
          res.status(400).send(FiredevHelpers.JSON.stringify({
            stack: err.stack,
            message: err.message
          }))
        } else {
          Helpers.log(error)
          Helpers.error(`[Firedev] Bad result isomorphic method: ${error}`, true, false)
          res.status(400).send(FiredevHelpers.JSON.stringify(error))
        }
        //#endregion
      }
    });
  }

  return {
    routePath: expressPath,
    method: methodConfig.type
  }

}

//#endregion
