//#region @websql
import { Helpers, _ } from 'tnp-core';
import { Models } from '../models';
import { MorphiHelpers } from '../helpers';
import { SYMBOL } from '../symbols';
import { EntityProcess } from './entity-process';
import { FrameworkContext } from '../framework/framework-context';
//#region @backend
import { Blob } from 'buffer';
//#endregion
// TODO below thing needs to be there
// @ts-ignore
export function initMethodNodejs(
  type: Models.Rest.HttpMethod,
  methodConfig: Models.Rest.MethodConfig,
  classConfig: Models.Rest.ClassConfig,
  expressPath: string,
  target: Function
): any {


  const requestHandler = (methodConfig.requestHandler && typeof methodConfig.requestHandler === 'function')
    ? methodConfig.requestHandler : (req, res, next) => { next() };

  const context = FrameworkContext.findForTraget(target);
  const url = context.uri;

  url.pathname = url.pathname.replace(/\/$/, '');
  expressPath = url.pathname.startsWith('/') ? `${url.pathname}${expressPath}` : expressPath;
  expressPath = expressPath.replace(/\/\//g, '/')
  // console.log(`BACKEND: expressPath: ${expressPath}`)

  //#region @websqlOnly
  if (!context.node.app) {
    // @ts-ignore
    context.node.app = {}
  }
  //#endregion

  if (!context.onlyForBackendRemoteServerAccess) {
    //#region @websql
    if (!context.node.app[type.toLowerCase()]) {
      context.node.app[type.toLowerCase()] = () => { }
    }
    console.log(`[${type.toUpperCase()}] ${expressPath}`);
    //#endregion


    context.node.app[type.toLowerCase()](expressPath, requestHandler, async (req, res) => {

      const args: any[] = [];

      let tBody = req.body;
      let tParams = req.params;
      let tQuery = req.query;

      if (req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_BODY]) {
        try {
          tBody = MorphiHelpers.JSON.parse(JSON.stringify(tBody), JSON.parse(req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_BODY]));
        } catch (e) { }
      }

      if (req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]) {
        try {
          tQuery = MorphiHelpers.JSON.parse(JSON.stringify(tQuery), JSON.parse(req.headers[SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]));
        } catch (e) { }
      }

      // make class instance from body
      // console.log('req.headers', req.headers)
      if (req.headers[SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS]) {
        try {
          const entity = JSON.parse(req.headers[SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS]);
          tBody = MorphiHelpers.Mapping.encode(tBody, entity);
        } catch (e) { }
      } else {
        Object.keys(tBody).forEach(paramName => {
          try {
            const entityForParam = JSON.parse(req.headers[`${SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS}${paramName}`]);
            tBody[paramName] = MorphiHelpers.Mapping.encode(tBody[paramName], entityForParam);
          } catch (e) { }
        })
      }

      // make class instance from query params
      // console.log('req.headers', tQuery)
      if (req.headers[SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS]) {

        try {
          const entity = JSON.parse(req.headers[SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS]);
          tQuery = MorphiHelpers.parseJSONwithStringJSONs(MorphiHelpers.Mapping.encode(tQuery, entity));
        } catch (e) { }
      } else {
        Object.keys(tQuery).forEach(queryParamName => {
          try {
            const entityForParam = JSON.parse(req.headers[`${SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${queryParamName}`]);
            let beforeTransofrm = tQuery[queryParamName];
            if (_.isString(beforeTransofrm)) {
              try {
                const paresed = MorphiHelpers.tryTransformParam(beforeTransofrm)
                beforeTransofrm = paresed;
              } catch (e) { }
            }
            const afterEncoding = MorphiHelpers.Mapping.encode(beforeTransofrm, entityForParam);
            tQuery[queryParamName] = MorphiHelpers.parseJSONwithStringJSONs(afterEncoding);
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
      const resolvedParams = args.reverse().map(v => MorphiHelpers.tryTransformParam(v));
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
        let result = await MorphiHelpers.getResponseValue(response, req, res);
        // console.log({
        //   result
        // })
        // debugger
        if (result instanceof Blob) {
          // res.type(blob.type)
          // blob.arrayBuffer().then((buf) => {
          //     res.send(Buffer.from(buf))
          // }


          const blob = result as Blob;
          res.type(blob.type);
          const toSend = await blob.arrayBuffer();
          res.send(toSend);

          // res.writeHead(200, {
          //   'Content-Type': blob.type,
          //   'Content-Length': blob.size
          // });
          // const buffer = await blob.arrayBuffer();
          // res.end(buffer);
        } else if (methodConfig.contentType && methodConfig.contentType !== 'multipart/form-data' && methodConfig.responseType) {
          // TODO handle buffor or blob instance reponse
          //#region @backend
          // SENDING BLOB (string)
          // Extract image data
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
          // console.log('REQUEST RESULT', result)
          await EntityProcess.init(result, res);
        }

      } catch (error) {
        if (_.isString(error)) {
          res.status(400).send(MorphiHelpers.JSON.stringify({
            message: `
  Error inside: ${req.path}

  ${error}

  `
          }))
        } else if (error instanceof Models.Errors) {
          Helpers.error(error, true, false)
          const err: Models.Errors = error;
          res.status(400).send(MorphiHelpers.JSON.stringify(err))
        } else if (error instanceof Error) {
          const err: Error = error;
          Helpers.error(error, true, false)
          res.status(400).send(MorphiHelpers.JSON.stringify({
            stack: err.stack,
            message: err.message
          }))
        } else {
          Helpers.log(error)
          Helpers.error(`[Firedev] Bad result isomorphic method: ${error}`, true, false)
          res.status(400).send(MorphiHelpers.JSON.stringify(error))
        }
      }

    });

  }

  return {
    routePath: expressPath,
    method: methodConfig.type
  }

}

//#region @backend
function betterError(error) {
  console.log(require('callsite-record')({
    forError: error
  }).renderSync({
    // stackFilter(frame) {
    //   return !frame.getFileName().includes('node_modules');
    // }
  }))
}
//#endregion
//#endregion
