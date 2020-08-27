import { GlobalConfig } from '../global-config';
import { SYMBOL } from '../symbols';
import * as _ from 'lodash';
import { Models } from '../models';
import { Resource } from 'ng2-rest';
import { Models as Ng2RestModels } from 'ng2-rest';
import { Helpers } from '../helpers';

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


  // console.log(`FRONTEND ${target.name} method on ${expressPath}`)

  target.prototype[methodConfig.methodName] = function (...args) {
    // console.log('FRONTEND expressPath', expressPath)
    const productionMode = GlobalConfig.vars.productionMode;
    let uri: URL = GlobalConfig.vars.url;
    //#region @backend
    if (GlobalConfig.vars.onlyForBackendRemoteServerAccess) {
      uri = this.host; // TODO QUICK_FIX for backgroud-worker-process
    }
    //#endregion
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
      //#endregion
      // debugger
      if (currentParam.paramType === 'Path') {
        pathPrams[currentParam.paramName] = param;
      }
      if (currentParam.paramType === 'Query') {
        if (currentParam.paramName) {
          const mapping = Helpers.Mapping.decode(param, !GlobalConfig.vars.isProductionMode);
          if (mapping) {
            rest.headers.set(
              `${SYMBOL.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${currentParam.paramName}`,
              JSON.stringify(mapping))
          }
          queryParams[currentParam.paramName] = param;
        } else {
          const mapping = Helpers.Mapping.decode(param, !GlobalConfig.vars.isProductionMode);
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
          const mapping = Helpers.Mapping.decode(param, !GlobalConfig.vars.isProductionMode);
          if (mapping) {
            rest.headers.set(
              `${SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS}${currentParam.paramName}`,
              JSON.stringify(mapping))
          }
          item[currentParam.paramName] = param;
        } else {
          const mapping = Helpers.Mapping.decode(param, !GlobalConfig.vars.isProductionMode);
          if (mapping) {
            rest.headers.set(
              SYMBOL.MAPPING_CONFIG_HEADER_BODY_PARAMS,
              JSON.stringify(mapping))
          }
          item = param;
        }
      }
    });
    // debugger;
    if (typeof item === 'object') {
      let circuralFromItem = []
      item = Helpers.JSON.parse(Helpers.JSON.stringify(item, void 0, void 0, circs => {
        circuralFromItem = circs;
      }))
      rest.headers.set(
        SYMBOL.CIRCURAL_OBJECTS_MAP_BODY,
        JSON.stringify(circuralFromItem)
      )
    }

    if (typeof queryParams === 'object') {
      let circuralFromQueryParams = []
      queryParams = Helpers.JSON.parse(Helpers.JSON.stringify(queryParams, void 0, void 0, circs => {
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
