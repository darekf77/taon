import { SYMBOL } from '../symbols';
import { _ } from 'tnp-core';
import { Models } from '../models';
import { Resource } from 'ng2-rest';
import { Models as Ng2RestModels } from 'ng2-rest';
import { Helpers } from 'tnp-core';
import { MorphiHelpers } from '../helpers';
import { FrameworkContext } from '../framework/framework-context';
import { from } from 'rxjs';
// const subjectHandler = Symbol();

export function initMethodBrowser(target, type: Models.Rest.HttpMethod, methodConfig: Models.Rest.MethodConfig, expressPath) {
  let storage: any;
  if (Helpers.isBrowser) {
    storage = window;
  }
  //#region @backend
  if (Helpers.isNode) {
    storage = global;
  }
  //#endregion

  const context = FrameworkContext.findForTraget(target);
  const uri: URL = context.uri;

  //#region @websqlOnly

  const orgMethods = target.prototype[methodConfig.methodName];
  target.prototype[methodConfig.methodName] = function (...args) {
    // if (!target.prototype[methodConfig.methodName][subjectHandler]) {
    //   target.prototype[methodConfig.methodName][subjectHandler] = new Subject();
    // }
    const received = new Promise(async (resove, reject) => {
      const { request, response } = websqlMocks()

      let res: any;
      try {
        res = await Helpers.runSyncOrAsync({
          functionFn: orgMethods,
          context: this,
          arrayOfParams: args
        }, args);
        // console.log({ res1: res })
        if (typeof res === 'function') {
          res = await Helpers.runSyncOrAsync({
            functionFn: res,
            context: this,
            arrayOfParams: [request, response]
          });
        }
        // console.log({ res2: res })
        if (typeof res === 'function') {
          res = await Helpers.runSyncOrAsync({
            functionFn: res,
            context: this,
            arrayOfParams: [request, response]
          });
        }
        // console.log({ res3: res })
        if (typeof res === 'object' && res.received) {
          res = await res.received;
        }
        // console.log({ res4: res })
        const body = res;
        res = new Ng2RestModels.HttpResponse({
          body: void 0,
          isArray: void 0 as any,
          method: methodConfig.type,
          url: `${uri.origin}${'' // TODO express path
            }${methodConfig.path}`
        }, _.isString(body) ? body : JSON.stringify(body),
          void 0,
          void 0,
          () => body,
        );

        // console.log('NEXT', res);
        // target.prototype[methodConfig.methodName][subjectHandler].next(res);

        resove(res);
      } catch (error) {
        // error = new Ng2RestModels.HttpResponseError('Error during websql request',
        //   JSON.stringify(error));
        // target.prototype[methodConfig.methodName][subjectHandler].error(error);
        reject(error);
      }
    });
    received['observable'] = from(received);
    return {
      received
    }
  }
  return;
  //#endregion

  // FRONTEND PATHES
  // console.log(`FRONTEND ${target.name} method on ${expressPath}`)

  target.prototype[methodConfig.methodName] = function (...args) {
    // console.log('FRONTEND expressPath', expressPath)
    // const productionMode = FrameworkContext.isProductionMode;


    if (!storage[SYMBOL.ENDPOINT_META_CONFIG]) storage[SYMBOL.ENDPOINT_META_CONFIG] = {};
    if (!storage[SYMBOL.ENDPOINT_META_CONFIG][uri.href]) storage[SYMBOL.ENDPOINT_META_CONFIG][uri.href] = {};
    const endpoints = storage[SYMBOL.ENDPOINT_META_CONFIG];
    let rest: Ng2RestModels.ResourceModel<any, any>;
    if (!endpoints[uri.href][expressPath]) {
      rest = Resource.create(uri.href, expressPath, SYMBOL.MAPPING_CONFIG_HEADER as any,
        SYMBOL.CIRCURAL_OBJECTS_MAP_BODY as any) as any;
      endpoints[uri.href][expressPath] = rest;
    } else {
      rest = endpoints[uri.href][expressPath] as any;
    }

    const method = type.toLowerCase();
    const isWithBody = (method === 'put' || method === 'post');
    const pathPrams = {};
    let queryParams = {};
    let item = {};
    args.forEach((param, i) => {
      let currentParam: Models.Rest.ParamConfig;
      //#region find param
      for (let pp in methodConfig.parameters) {
        let v = methodConfig.parameters[pp];
        if (v.index === i) {
          currentParam = v;
          break;
        }
      }


      if (currentParam.paramType === 'Path') {
        pathPrams[currentParam.paramName] = param;
      }
      if (currentParam.paramType === 'Query') {
        if (currentParam.paramName) {
          const mapping = MorphiHelpers.Mapping.decode(param, !FrameworkContext.isProductionMode);
          if (mapping) {
            rest.headers.set(
              `${SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${currentParam.paramName}`,
              JSON.stringify(mapping))
          }
          queryParams[currentParam.paramName] = param;
        } else {
          const mapping = MorphiHelpers.Mapping.decode(param, !FrameworkContext.isProductionMode);
          if (mapping) {
            rest.headers.set(
              SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS,
              JSON.stringify(mapping))
          }
          queryParams = _.cloneDeep(param);
        }
      }
      if (currentParam.paramType === 'Header') {
        if (currentParam.paramName) {
          if (currentParam.paramName === SYMBOL.MDC_KEY) { // parese MDC
            rest.headers.set(currentParam.paramName, encodeURIComponent(JSON.stringify(param)))
          } else {
            rest.headers.set(currentParam.paramName, param)
          }
        } else {
          for (let header in param) {
            rest.headers.set(header, param[header])
          }
        }
      }
      if (currentParam.paramType === 'Cookie') {
        Resource.Cookies.write(currentParam.paramName, param, currentParam.expireInSeconds);
      }
      if (currentParam.paramType === 'Body') {
        if (currentParam.paramName) {
          const mapping = MorphiHelpers.Mapping.decode(param, !FrameworkContext.isProductionMode);
          if (mapping) {
            rest.headers.set(
              `${SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS}${currentParam.paramName}`,
              JSON.stringify(mapping))
          }
          item[currentParam.paramName] = param;
        } else {
          const mapping = MorphiHelpers.Mapping.decode(param, !FrameworkContext.isProductionMode);
          if (mapping) {
            rest.headers.set(
              SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS,
              JSON.stringify(mapping))
          }
          item = param;
        }
      }
    });

    if (typeof item === 'object') {
      let circuralFromItem = []
      item = MorphiHelpers.JSON.parse(MorphiHelpers.JSON.stringify(item, void 0, void 0, circs => {
        circuralFromItem = circs;
      }))
      rest.headers.set(
        SYMBOL.CIRCURAL_OBJECTS_MAP_BODY,
        JSON.stringify(circuralFromItem)
      )
    }

    if (typeof queryParams === 'object') {
      let circuralFromQueryParams = []
      queryParams = MorphiHelpers.JSON.parse(MorphiHelpers.JSON.stringify(queryParams, void 0, void 0, circs => {
        circuralFromQueryParams = circs;
      }))

      rest.headers.set(
        SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM,
        JSON.stringify(circuralFromQueryParams))
    }

    return {
      received: isWithBody ? rest.model(pathPrams)[method](item, [queryParams]) : rest.model(pathPrams)[method]([queryParams])
    }
  };
}



//#region @websqlOnly
function websqlMocks() {
  const response: Express.Response = {
    setHeader() {
      // console.log('Dummy set header', arguments)
    }
  };
  const request: Express.Request = {};
  return { request, response }
}
//#endregion
