//#region imports
import { Translation } from '@taon-dev/i18n/src';
import { JSON10 } from 'json10/src';
import {
  decodeMappingForHeaderJson,
  HttpResponse,
  Ng2RestFetchRequestConfig,
  Resource,
  RestHeaders,
  ResponseTypeFetchHeaderKey,
  FetchResponse,
} from 'ng2-rest/src';
import { from, Subject } from 'rxjs';
import { config } from 'tnp-core/src';
import { CoreModels } from 'tnp-core/src';
import { UtilsOs } from 'tnp-core/src';
import { _, Helpers } from 'tnp-core/src';

import type { TaonBaseMiddleware } from './base-classes/base-middleware';
import { MethodConfig } from './config/method-config';
import { ParamConfig } from './config/param-config';
import { localFileLangHeader } from './constants';
import type { EndpointContext } from './endpoint-context';
import { ClassHelpers } from './helpers/class-helpers';
import { TaonHelpers } from './helpers/taon-helpers';
import { Models } from './models';
import { Symbols } from './symbols';
//#endregion

export class EndpointClient {
  constructor(private ctx: EndpointContext) {}

  //#region methods & getters / init client
  /**
   * client can be browser or nodejs (when remote host)
   */
  public initClient(
    target: Function,
    httpRequestType: CoreModels.HttpMethod,
    methodConfig: Partial<MethodConfig>, // Models.Http.Rest.MethodConfig,
    expressPath: string,
  ): void {
    const ctx = this.ctx;
    // const controllerInstance = this.getInstanceBy(
    //   target as any,
    // ) as TaonBaseController;

    // console.log({ clientExpressPath: expressPath });
    // console.log(
    //   `CLIENT: expressPath: "${expressPath}" interceptor for method: ${methodConfig.calculatedMiddlewares?.length} `,
    // );

    //#region init middlewares
    const middlewares = methodConfig.calculatedMiddlewares;
    const middlewaresInstances = middlewares
      .map(f => ctx.getInstanceBy(f as any) as TaonBaseMiddleware)
      .filter(f => _.isFunction(f.interceptClientMethod));

    middlewaresInstances.forEach(instance => {
      const middlewareName = ClassHelpers.getName(instance);
      // middlewareName - only needed for inheritace and uniqness of interceptors
      const interceptorKey = `${middlewareName}-${methodConfig.type?.toUpperCase()}-${expressPath}`;
      Resource.methodsInterceptors.set(interceptorKey, {
        intercept: ({ req, next }) => {
          return instance.interceptClientMethod(
            {
              req,
              next,
            },
            {
              methodName: methodConfig.methodName as any,
              expressPath,
              httpRequestType: httpRequestType,
            },
          );
        },
      });
    });
    //#endregion

    const orgMethods = target.prototype[methodConfig.methodName as any];

    //#region handle electron ipc request

    if (UtilsOs.isElectron) {
      const ipcRenderer = (window as any).require('electron').ipcRenderer;
      target.prototype[methodConfig.methodName as any] = function (...args) {
        const received = new Promise(async (resolve, reject) => {
          const headers = {};
          const { request, response } = TaonHelpers.websqlMocks(headers);

          //#region @browser
          ipcRenderer.once(
            TaonHelpers.ipcKeyNameResponse(target, methodConfig, expressPath),
            (event, responseData) => {
              let res: any = responseData;
              // console.log({ responseData });
              try {
                const body = res;
                const responseStrinOrBlob: any =
                  Helpers.isBlob(body) || _.isString(body)
                    ? body
                    : JSON.stringify(body);
                res = new HttpResponse(
                  `${ctx.uriOrigin}${
                    '' // TODO express path
                  }${methodConfig.path} `,
                  methodConfig.type,
                  {} as FetchResponse,
                  responseStrinOrBlob,
                  RestHeaders.from(headers),
                  200,
                  {
                    // responseMapping: {
                    //   // entity: ()=>  TODO for electron
                    // },
                  },
                  false,
                );

                resolve(res);
              } catch (error) {
                console.error(error);
                reject(error);
              }
            },
          );
          ipcRenderer.send(
            TaonHelpers.ipcKeyNameRequest(target, methodConfig, expressPath),
            args,
          );
          //#endregion
        });
        received['observable'] = from(received);
        return {
          received,
          request(axiosConfig: Ng2RestFetchRequestConfig) {
            return received;
          },
        } as Models.Http.ClientAction<any>;
      };
      return;
    }
    //#endregion

    //#region handling web sql request
    //#region @websqlOnly

    //#region resolve variables
    const MIN_TIMEOUT = 100;
    const MIN_TIMEOUT_STEP = 10;

    const globalThisVar = globalThis; // TODO not a good idea! probably should be in context

    const timeout =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_TIMEOUT] || MIN_TIMEOUT;

    let updateFun: Subject<number> =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN];
    if (!globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN]) {
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN] = new Subject();
    }
    updateFun = globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN];

    let startFun: Subject<void> =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START];
    if (!globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START]) {
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START] = new Subject();
    }
    startFun = globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_START];

    let doneFun: Subject<void> =
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE];
    if (!globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE]) {
      globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE] = new Subject();
    }
    doneFun = globalThisVar[Symbols.old.WEBSQL_REST_PROGRESS_FUN_DONE];

    let periodsToUpdate = 0;
    if (timeout >= MIN_TIMEOUT) {
      periodsToUpdate = Math.floor(timeout / MIN_TIMEOUT_STEP);
    }
    //#endregion

    //#region web sql periods to wait
    const periods = async () => {
      startFun.next();
      for (let n = 1; n <= periodsToUpdate; n++) {
        // if (n === 0) {
        // updateFun.next(0)
        // } else {
        let upValue = Math.round(((MIN_TIMEOUT_STEP * n) / timeout) * 100);
        if (upValue > 100) {
          upValue = 100;
        }
        // console.log(`ping upValue: ${ upValue } `)
        updateFun.next(upValue);
        // }
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(void 0);
          }, MIN_TIMEOUT_STEP);
        });
        // console.log('pong')
      }
      doneFun.next();
    };
    //#endregion

    target.prototype[methodConfig.methodName as any] = function (...args) {
      // if (!target.prototype[methodConfig.methodName][subjectHandler]) {
      //   target.prototype[methodConfig.methodName][subjectHandler] = new Subject();
      // }
      const received = new Promise(async (resolve, reject) => {
        const headers = {};
        const { request, response } = TaonHelpers.websqlMocks(headers);

        let res: any;
        try {
          res = await Helpers.runSyncOrAsync({
            functionFn: orgMethods,
            context: this,
            arrayOfParams: args,
          });
          // console.log({ res1: res })
          if (typeof res === 'function') {
            res = await Helpers.runSyncOrAsync({
              functionFn: res,
              context: this,
              arrayOfParams: [request, response],
            });
          }
          // console.log({ res2: res })
          if (typeof res === 'function') {
            res = await Helpers.runSyncOrAsync({
              functionFn: res,
              context: this,
              arrayOfParams: [request, response],
            });
          }
          // console.log({ res3: res })

          if (typeof res === 'object' && res?.received) {
            res = await res.received;
          }

          const body = res;
          const stringOrBlobData: any =
            Helpers.isBlob(body) || _.isString(body)
              ? body
              : JSON.stringify(body);

          // TODO SHOULD BE IMPLEMENTED IN NG2-REST
          res = new HttpResponse(
            `${ctx.uriOrigin}${
              '' // TODO express path
            }${methodConfig.path} `,
            methodConfig.type,
            {} as FetchResponse,
            stringOrBlobData,
            RestHeaders.from(headers),
            200,
            {},
            false,
          );

          // TODO blob should be blob not json
          // console.log('NEXT', res);
          // target.prototype[methodConfig.methodName][subjectHandler].next(res);

          await periods();
          resolve(res);
        } catch (error) {
          await periods();
          console.error(error);
          // error = new Ng2RestModels.HttpResponseError('Error during websql request',
          //   JSON.stringify(error));
          // target.prototype[methodConfig.methodName][subjectHandler].error(error);
          reject(error);
        }
      });
      received['observable'] = from(received);
      // debugger
      if (UtilsOs.isWebSQL) {
        return {
          received,
          request(axiosConfig: Ng2RestFetchRequestConfig) {
            // console.log('request', axiosConfgi);
            return received;
          },
        } as Models.Http.ClientAction<any>;
      }
    };
    if (UtilsOs.isWebSQL) {
      // @ts-ignore
      return undefined as any as Models.Http.ClientAction<any>;
    }
    //#endregion
    //#endregion

    return this.normalHttpRequest(
      target,
      methodConfig,
      httpRequestType,
      expressPath,
    );
  }
  //#endregion

  //#region normal http request
  private normalHttpRequest(
    target: Function,
    methodConfig: Partial<MethodConfig>,
    httpRequestType: CoreModels.HttpMethod,
    expressPath: string,
  ): void {
    //#region handle normal request

    // TODO QUICK_FIX may not be good idea
    const storage = globalThis;

    const ctx = this.ctx;

    target.prototype[methodConfig.methodName as any] = function (
      this: { t: Translation },
      ...args
    ): Models.Http.ClientAction<any> {
      // console.log('this t', { t: this.t });
      // console.log('[init method browser] FRONTEND expressPath', expressPa/h)
      // const productionMode = FrameworkContext.isProductionMode;

      //#region resolve frontend parameters

      //#region set initial header && assign rest

      let rest: ReturnType<typeof Resource.create>;
      const requestHeaders = RestHeaders.from({});

      if (this.t) {
        requestHeaders.set(localFileLangHeader, this.t.localFileLang);
      }

      // if (!endpoints[ctx.uriOrigin][expressPath]) {
      if (
        methodConfig.overrideContentType &&
        !methodConfig.overrideResponseType
      ) {
        //#region assign only override content type
        rest = Resource.create(ctx.uriOrigin, expressPath, {
          responseMapping: {
            entity: Symbols.old.MAPPING_CONFIG_HEADER,
            circular: Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM,
          },
        });
        requestHeaders.apply({
          'Content-Type': methodConfig.overrideContentType,
          Accept: methodConfig.overrideContentType,
        });
        //#endregion
      } else if (
        methodConfig.overrideContentType &&
        methodConfig.overrideResponseType
      ) {
        //#region assign both
        rest = Resource.create(ctx.uriOrigin, expressPath, {
          responseMapping: {
            entity: Symbols.old.MAPPING_CONFIG_HEADER,
            circular: Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM,
          },
        });
        requestHeaders.apply({
          'Content-Type': methodConfig.overrideContentType,
          Accept: methodConfig.overrideContentType,
          [ResponseTypeFetchHeaderKey]: methodConfig.overrideResponseType,
        });
        //#endregion
      } else if (
        !methodConfig.overrideContentType &&
        methodConfig.overrideResponseType
      ) {
        //#region assign response type only
        rest = Resource.create(ctx.uriOrigin, expressPath, {
          responseMapping: {
            entity: Symbols.old.MAPPING_CONFIG_HEADER,
            circular: Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM,
          },
        });
        requestHeaders.apply({
          [ResponseTypeFetchHeaderKey]: methodConfig.overrideResponseType,
        });
        //#endregion
      } else {
        //#region skip initial headers
        rest = Resource.create(
          ctx.uriOrigin,
          expressPath,
          {
            responseMapping: {
              entity: Symbols.old.MAPPING_CONFIG_HEADER,
              circular: Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM,
            },
          },
          // Symbols.old.MAPPING_CONFIG_HEADER as any,
          // Symbols.old.CIRCURAL_OBJECTS_MAP_BODY as any,
        );
        //#endregion
      }
      if (methodConfig.overrideContentType) {
        requestHeaders.set('Content-Type', methodConfig.overrideContentType);
        requestHeaders.set('Accept', methodConfig.overrideContentType);
      }

      //#endregion

      const method = httpRequestType.toLowerCase();

      const pathPrams = {};
      let queryParams = {};
      let bodyObjectOnFE = {};

      args.forEach((param, i) => {
        let currentParam: Partial<ParamConfig> = void 0 as any;

        for (let pp in methodConfig.parameters) {
          let v = methodConfig.parameters[pp];
          if (v.index === i) {
            currentParam = v;
            break;
          }
        }

        if (!currentParam) {
          const errorMessage =
            `[${config.frameworkName}] Unable to resolve parameter` +
            ` at index ${i} for method ${methodConfig.methodName as any}
            at path ${expressPath}.


            Did you forget @GET('param'), @POST etc. for you parmas?

            `;

          throw new Error(errorMessage);
        }

        const optionsDecodeHeader = {
          useFirstArrayItemClassNameForAllElements: true,
        };

        if (currentParam.paramType === 'Path') {
          //#region handle path params
          pathPrams[currentParam.paramName] = param;
          //#endregion
        }
        if (currentParam.paramType === 'Query') {
          //#region handle query params
          if (currentParam.paramName) {
            const mapping = decodeMappingForHeaderJson(
              param,
              optionsDecodeHeader,
            );
            if (mapping) {
              requestHeaders.set(
                `${Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${currentParam.paramName.toLowerCase()}`,
                JSON.stringify(mapping),
              );
            }
            queryParams[currentParam.paramName] = param;
          } else {
            const mapping = decodeMappingForHeaderJson(
              param,
              optionsDecodeHeader,
            );
            if (mapping) {
              requestHeaders.set(
                Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS,
                JSON.stringify(mapping),
              );
            }
            queryParams = _.cloneDeep(param);

            if (currentParam.sendCircuralObject) {
              //#region process circural object form fe
              let circuralFromItem = [];
              queryParams = JSON10.parse(
                JSON10.stringify(queryParams, void 0, void 0, circs => {
                  circuralFromItem = circs;
                }),
              );
              requestHeaders.set(
                Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM,
                JSON10.stringify(circuralFromItem),
              );
              //#endregion
            }
          }
          //#endregion
        }
        if (currentParam.paramType === 'Header') {
          //#region handler header params
          if (currentParam.paramName) {
            if (currentParam.paramName === Symbols.old.MDC_KEY) {
              // parese MDC
              requestHeaders.set(
                currentParam.paramName,
                encodeURIComponent(JSON.stringify(param)),
              );
            } else {
              requestHeaders.set(currentParam.paramName, param);
            }
          } else {
            for (let header in param) {
              requestHeaders.set(header, param[header]);
            }
          }
          //#endregion
        }
        if (currentParam.paramType === 'Cookie') {
          //#region handle cookie params
          Resource.Cookies.write(
            currentParam.paramName,
            param,
            currentParam.expireInSeconds,
          );
          //#endregion
        }
        if (currentParam.paramType === 'Body') {
          //#region handle body params
          const isFormDataOrBinary =
            param instanceof Blob ||
            param instanceof ArrayBuffer ||
            ArrayBuffer.isView(param) ||
            (!_.isBoolean(param) &&
              !_.isNumber(param) &&
              ClassHelpers.getName(param) === 'FormData');

          // console.log({ param, isFormDataOrBinary });

          if (currentParam.paramName) {
            //#region handle in param
            if (isFormDataOrBinary) {
              //#region prevent posting/putting not full body as FormData
              throw new Error(`[taon - framework] Don use param names when posting / putting FormData.
              Use this:
// ...
(@Taon.Http.Param.Body() formData: FormData) ...
// ...

instead
  // ...
  (@Taon.Http.Param.Body('${currentParam.paramName}') formData: FormData) ...
// ...
`);
              //#endregion
            }
            const mapping = decodeMappingForHeaderJson(
              param,
              optionsDecodeHeader,
            );
            if (mapping) {
              requestHeaders.set(
                `${Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS}${currentParam.paramName.toLowerCase()}`,
                JSON.stringify(mapping),
              );
            }
            bodyObjectOnFE[currentParam.paramName] = param;
            //#endregion
          } else {
            //#region handle whoel body
            if (!isFormDataOrBinary) {
              const mapping = decodeMappingForHeaderJson(
                param,
                optionsDecodeHeader,
              );
              if (mapping) {
                requestHeaders.set(
                  Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS,
                  JSON.stringify(mapping),
                );
              }
            }

            bodyObjectOnFE = param;

            if (currentParam.sendCircuralObject && !isFormDataOrBinary) {
              //#region process circural object form fe
              let circuralFromItem = [];
              bodyObjectOnFE = JSON10.parse(
                JSON10.stringify(bodyObjectOnFE, void 0, void 0, circs => {
                  circuralFromItem = circs;
                }),
              );
              requestHeaders.set(
                Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM,
                JSON10.stringify(circuralFromItem),
              );
              //#endregion
            }
            //#endregion
          }
          //#endregion
        }
      });

      //#endregion

      const httpResultObj: Models.Http.ClientAction<any> = {
        /**
         * @deprecated use request()
         */
        get received() {
          return rest
            .model(pathPrams, { headers: requestHeaders })
            [method](bodyObjectOnFE, [queryParams]);
        },
        request(fetchConfig?: Ng2RestFetchRequestConfig) {
          //#region again make sure that mixed headers will get override content values
          if (
            fetchConfig?.headers ||
            methodConfig.overrideContentType === 'application/octet-stream'
          ) {
            const headers = new Headers(fetchConfig?.headers);
            for (const [key, value] of Object.entries(
              requestHeaders.toJSON(),
            )) {
              if (!headers.has(key)) {
                headers.set(
                  key,
                  Array.isArray(value) ? value.join(',') : value,
                );
              }
            }
            if (
              methodConfig.overrideContentType === 'application/octet-stream'
            ) {
              headers.set('Content-Type', 'application/octet-stream');
            }
            fetchConfig = { ...fetchConfig, headers };
          }
          //#endregion

          return rest
            .model(pathPrams, { headers: requestHeaders })
            [method](bodyObjectOnFE, [queryParams], fetchConfig);
        },
      };
      return httpResultObj as Models.Http.ClientAction<any>;
    };
    //#endregion
  }
  //#endregion
}
