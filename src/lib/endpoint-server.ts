//#region imports
import { Translation } from '@taon-dev/i18n/src';
import type { ipcMain } from 'electron'; // @backend
import type { Application } from 'express';
import { JSON10 } from 'json10/src';
import { encodeMapping, FetchResponseType } from 'ng2-rest/src';
import { UtilsStdinStdoutLogger } from 'tnp-core/src';
import { CoreModels } from 'tnp-core/src';
import { UtilsOs } from 'tnp-core/src';
import { _, Helpers } from 'tnp-core/src';

import type { TaonBaseController } from './base-classes/base-controller';
import type { TaonBaseMiddleware } from './base-classes/base-middleware';
import type { ControllerConfig } from './config/controller-config';
import { MethodConfig } from './config/method-config';
import { ParamConfig } from './config/param-config';
import { localFileLangHeader } from './constants';
import type { EndpointContext } from './endpoint-context';
import { EntityProcess } from './entity-process';
import {
  ExpressNextFunction,
  ExpressRequest,
  ExpressRequestHandler,
  ExpressResponse,
} from './express-types';
import { getResponseValue } from './get-response-value';
import { ClassHelpers } from './helpers/class-helpers';
import {
  requestToFormData,
  TaonUploadedFile,
} from './helpers/express-request-to-form-data';
import { TaonHelpers } from './helpers/taon-helpers';
import { Models } from './models';
import { Symbols } from './symbols';
//#endregion

export class EndpointServer {
  constructor(private ctx: EndpointContext) {}

  //#region API / init server
  public initServer(
    //#region parameters
    httpMethodType: CoreModels.HttpMethod,
    methodConfig: Partial<MethodConfig>,
    classConfig: ControllerConfig,
    expressPath: string,
    target: Function,
    overrideExpressApp: Application,
    //#endregion
  ): { expressPath: string; method: CoreModels.HttpMethod } {
    //#region resolve variables
    const controllerInstance = this.ctx.getInstanceBy(
      target as any,
    ) as TaonBaseController;
    const t: Translation = controllerInstance.t
      ? controllerInstance.t
      : ({
          changeFileLang: () => {
            // TODO implement translating for request
            return;
          },
          gettext: text => {
            // TODO implement translating for request
            return text;
          },
          translate: text => {
            // TODO implement translating for request
            return text;
          },
        } as any);
    if (overrideExpressApp) {
      this.ctx.expressApp = overrideExpressApp;
    }
    // console.log(
    //   `CLIENT: expressPath: "${expressPath}" interceptor for method: ${methodConfig.calculatedMiddlewares.length}`,
    // );

    const middlewareHandlers = methodConfig.calculatedMiddlewares
      .map(middlewareClassFun => {
        const middlewareInstance: TaonBaseMiddleware = this.ctx.getInstanceBy(
          middlewareClassFun as any,
        );
        if (
          middlewareInstance &&
          _.isFunction(middlewareInstance.interceptServerMethod)
        ) {
          const middlewareFn = ClassHelpers.asyncHandler(
            async (
              req: ExpressRequest,
              res: ExpressResponse,
              next: ExpressNextFunction,
            ) => {
              await middlewareInstance.interceptServerMethod(
                {
                  req,
                  res,
                  next,
                },
                {
                  methodName: methodConfig.methodName as any,
                  expressPath,
                  httpRequestType: methodConfig.type,
                },
              );
            },
          );
          return middlewareFn;
        }
      })
      .filter(f => !!f) as ExpressRequestHandler[];

    // const url = this.uri;

    //#region get result
    const getResult = async (
      resolvedParams: any[],
      req: ExpressRequest,
      res: ExpressResponse,
      results: Models.Http.RequestResults,
    ) => {
      const response: Models.Http.Response<any> =
        methodConfig.descriptor.value.apply(
          /**
           * Context for method @GET,@PUT etc.
           */
          this.ctx.getInstanceBy(target as any),
          /**
           * Params for method @GET, @PUT etc.
           */
          resolvedParams,
        );

      let result = await getResponseValue(response, { req, res, results });
      return result;
    };
    //#endregion

    // console.log(`BACKEND: expressPath: "${expressPath}" `);
    //#endregion

    if (UtilsOs.isElectron) {
      //#region @backend
      const ipcKeyName = TaonHelpers.ipcKeyNameRequest(
        target,
        methodConfig,
        expressPath,
      );
      const electron = require('electron');

      (electron.ipcMain as typeof ipcMain).on(
        ipcKeyName,
        async (event, paramsFromBrowser) => {
          const responseJsonData = await getResult(
            paramsFromBrowser,
            void 0,
            void 0,
            { t, expressPath },
          );
          const sendToIpsMainOn = TaonHelpers.ipcKeyNameResponse(
            target,
            methodConfig,
            expressPath,
          );
          // console.log({ sendToIpsMainOn });
          event.sender.send(sendToIpsMainOn, responseJsonData);
        },
      );
      return {
        expressPath,
        method: methodConfig.type,
      };
      //#endregion
    }

    if (!this.ctx.isRemoteHost) {
      //#region @websql
      //#region apply dummy websql express routers
      if (UtilsOs.isWebSQL) {
        if (!this.ctx.expressApp[httpMethodType.toLowerCase()]) {
          this.ctx.expressApp[httpMethodType.toLowerCase()] = () => {};
          // TODO add middlewares for WEBSQL and ELECTRON mode
        }
      }
      //#endregion
      //#endregion

      //#region @backend
      // console.log('this.expressApp', this.expressApp);
      // this.logHttp &&
      //   console.log(`[${httpMethodType.toUpperCase()}] ${expressPath} `);

      this.ctx.expressApp[httpMethodType.toLowerCase()](
        expressPath,
        ...middlewareHandlers,
        async (req: ExpressRequest, res: ExpressResponse) => {
          // console.log(`[${httpMethodType.toUpperCase()}] ${expressPath} `);

          // @ts-expect-error
          if (controllerInstance?.beforeEachRequest) {
            try {
              await (controllerInstance as TaonBaseController) // @ts-expect-error
                ?.beforeEachRequest({
                  req,
                  res,
                  expressPath,
                  classConfig,
                  methodConfig,
                  t,
                } as Models.TaonCtrlBeforeEachRequestParams);
            } catch (error) {
              const { errroResult, status } = ClassHelpers.mapFnError(
                error,
                res,
              );
              if (UtilsOs.isRunningInCloudflareWorker()) {
                console.error(errroResult);
              }
              res.status(status).json(errroResult);
              return;
            }
          }
          const { args, bodyFormDataFiles } = await this.processParams(
            req,
            t,
            methodConfig,
            classConfig,
          );

          const resolvedParams = args
            .reverse()
            .map(v => TaonHelpers.tryTransformParam(v));

          //#region process request
          try {
            const resultFromCtrlExec = await getResult(
              resolvedParams,
              req,
              res,
              { bodyFormDataFiles, t, expressPath },
            );

            if (res.headersSent) {
              return;
            }

            const responseType = methodConfig.overrideResponseType as
              | FetchResponseType
              | undefined;

            if (methodConfig.overrideExpressSendAsHtml) {
              res.setHeader('Content-Type', 'text/html');
              res.send(resultFromCtrlExec);
              return;
            }

            return await this.handleResponseType(
              responseType,
              res,
              resultFromCtrlExec,
            );
          } catch (error) {
            if (UtilsStdinStdoutLogger.startedRegistering()) {
              console.error(
                `HTTP ERROR [ctx=${this.ctx.contextName}][${expressPath}]`,
                error,
              );
            }

            if (res.headersSent) {
              // SKIP FURTHER PROCESSING IF RESPONSE ALREADY SENT
              return;
            }
            if (methodConfig.overrideExpressSendAsHtml) {
              res.setHeader('Content-Type', 'text/html');
              res.send(error);
              return;
            }

            const { errroResult, status } = ClassHelpers.mapFnError(error, res);

            res.status(status).json(errroResult);
            return;
          }
          //#endregion
        },
      );
      //#endregion
    }

    return {
      expressPath: expressPath,
      method: methodConfig.type,
    };
  }
  //#endregion

  //#region method / handle respnse type
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async handleResponseType(
    responseType: FetchResponseType,
    res: ExpressResponse,
    resultFromCtrlExec: any,
  ) {
    //#region @backendFunc
    switch (responseType) {
      //#region stream

      case FetchResponseType.Stream: {
        if (!(resultFromCtrlExec instanceof ReadableStream)) {
          throw new Error(
            `[taon] Expected ReadableStream for response type "${FetchResponseType.Stream}".`,
          );
        }

        res.setHeader(
          'Content-Type',
          res.getHeader('Content-Type') || 'application/octet-stream',
        );

        if (UtilsOs.isRunningInCloudflareWorker()) {
          res.send(resultFromCtrlExec);
          return;
        }
        //#region @esmRemove
        const reader = resultFromCtrlExec.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            if (!res.write(Buffer.from(value))) {
              await new Promise<void>(resolve => {
                res.once('drain', resolve);
              });
            }
          }

          res.end();
        } finally {
          reader.releaseLock();
        }
        //#endregion
        return;
      }

      //#endregion

      //#region blob

      case FetchResponseType.Blob: {
        if (resultFromCtrlExec instanceof Blob) {
          const blob = resultFromCtrlExec;

          res.setHeader(
            'Content-Type',
            blob.type || 'application/octet-stream',
          );

          res.setHeader('Content-Length', blob.size.toString());

          const buffer = Buffer.from(await blob.arrayBuffer());

          res.end(buffer);

          return;
        }

        // Keep your old base64 support if you need backward compatibility.
        if (_.isString(resultFromCtrlExec)) {
          const match = /^data:(.+?);base64,(.+)$/.exec(resultFromCtrlExec);

          if (!match) {
            throw new Error(
              `[taon] Expected Blob or base64 data URL for response type "${FetchResponseType.Blob}".`,
            );
          }

          const [, contentType, fileBase64] = match;

          const buffer = Buffer.from(fileBase64, 'base64');

          res.setHeader('Content-Type', contentType);

          res.setHeader('Content-Length', buffer.length.toString());

          res.end(buffer);

          return;
        }

        throw new Error(
          `[taon] Expected Blob for response type "${FetchResponseType.Blob}".`,
        );
      }

      //#endregion

      //#region array buffer

      case FetchResponseType.ArrayBuffer: {
        if (!(resultFromCtrlExec instanceof ArrayBuffer)) {
          throw new Error(
            `[taon] Expected ArrayBuffer for response type "${FetchResponseType.ArrayBuffer}".`,
          );
        }

        const buffer = Buffer.from(resultFromCtrlExec);

        res.setHeader(
          'Content-Type',
          res.getHeader('Content-Type') || 'application/octet-stream',
        );

        res.setHeader('Content-Length', buffer.length.toString());

        res.end(buffer);

        return;
      }

      //#endregion

      //#region text

      case FetchResponseType.Text: {
        if (!_.isString(resultFromCtrlExec)) {
          throw new Error(
            `[taon] Expected string for response type "${FetchResponseType.Text}".`,
          );
        }

        res.type('text/plain');

        res.send(resultFromCtrlExec);

        return;
      }

      //#endregion

      //#region document

      case FetchResponseType.Document: {
        if (!_.isString(resultFromCtrlExec)) {
          throw new Error(
            `[taon] Expected HTML string for response type "${FetchResponseType.Document}".`,
          );
        }

        res.type('text/html');

        res.send(resultFromCtrlExec);

        return;
      }

      //#endregion

      //#region form data

      case FetchResponseType.FormData: {
        if (!(resultFromCtrlExec instanceof FormData)) {
          throw new Error(
            `[taon] Expected FormData for response type "${FetchResponseType.FormData}".`,
          );
        }

        throw new Error(
          `[taon] FormData response serialization is not implemented yet.`,
        );
      }

      //#endregion

      //#region json

      case FetchResponseType.Json:
      case undefined: {
        await new EntityProcess(res).run(resultFromCtrlExec);

        return;
      }

      //#endregion

      default: {
        throw new Error(`[taon] Unsupported response type: ${responseType}`);
      }
    }
    //#endregion
  }
  //#endregion

  //#region method / process params
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private async processParams(
    req: ExpressRequest,
    t: Translation,
    methodConfig: Partial<MethodConfig>,
    classConfig: ControllerConfig,
  ) {
    //#region @backendFunc
    const args: any[] = [];
    const tLang = req.headers[localFileLangHeader];
    // console.log({ tLang });
    if (tLang) {
      await t.changeFileLang(tLang as any);
    }

    let bodyFormDataFiles: TaonUploadedFile[] = [];

    let tBody = req.body;
    const requestContentType = req.headers['content-type'] || '';
    const isRequestFormData = requestContentType.startsWith(
      'multipart/form-data',
    );
    const isRequestBinary =
      requestContentType.split(';')[0].trim().toLowerCase() ===
      'application/octet-stream';

    if (isRequestFormData) {
      const { files, formData } = await requestToFormData(req);
      bodyFormDataFiles = files;
      // TODO handle somehow file
      tBody = formData;
    } else if (isRequestBinary) {
      tBody = req.raw?.body || req;
    } else {
      tBody = req.body;
    }

    let tParams = req.params;
    let tQuery: Object = req.query;

    // console.log({ tBody, tParams, tQuery, methodConfig });

    if (!isRequestFormData) {
      //#region process body params
      const bodyParamsToProcess = Object.values(methodConfig.parameters).filter(
        f => f.paramType === 'Body',
      );

      if (bodyParamsToProcess.length > 0 && !isRequestBinary) {
        const isUsingWholeBody = !_.isUndefined(
          bodyParamsToProcess.find(c => !c.paramName),
        );

        if (isUsingWholeBody && bodyParamsToProcess.length > 1) {
          const notEmpty = bodyParamsToProcess
            .filter(f => !!f.paramName)
            .map(c => `@Body('${c.paramName}') ${c.paramName}`)
            .join(', ');

          throw new Error(
            `

                  You are using more than ONE body param @Body() without name.

                  Or

                  your are overriding method with wrong params (like below)

                  class ParentClass {
                    ...
                    @${methodConfig.type?.toUpperCase()}()
                    ${methodConfig.methodName as any}(@Body()) {
                      // parent method
                    }
                     ...
                  }

                  class ${classConfig.className} extends AnyParentClass {
                    ...
                    @${methodConfig.type?.toUpperCase()}()
                    ${methodConfig.methodName as any}(${notEmpty}) { // ERROR
                      // your overrided method
                    }
                    ...
                  }
                  `,
          );
        }

        if (isUsingWholeBody) {
          try {
            const mappinForEntityBody = JSON.parse(
              TaonHelpers.firstStringOrElemFromArray(
                req.headers[Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS],
              ) ?? '{}',
            );
            tBody = encodeMapping(tBody, mappinForEntityBody);

            //#region handle circural item in body params
            if (req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM]) {
              try {
                const circs = JSON.parse(
                  TaonHelpers.firstStringOrElemFromArray(
                    req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM],
                  ) ?? '{}',
                );
                tBody = JSON10.applyCircularMapping(tBody, circs);
              } catch (e) {
                console.error(e);
              }
            }
            //#endregion
          } catch (e) {
            console.error(e);
          }
        } else {
          for (const bodyParamToProcess of bodyParamsToProcess) {
            try {
              const paramName = bodyParamToProcess.paramName;
              const mappingForEntityBodyForParam = JSON.parse(
                TaonHelpers.firstStringOrElemFromArray(
                  req.headers[
                    `${Symbols.old.MAPPING_CONFIG_HEADER_BODY_PARAMS}${paramName.toLowerCase()}`
                  ],
                ) ?? '{}',
              );

              const tBodyParamValue = tBody?.[paramName];

              if (tBodyParamValue != null) {
                tBody[paramName] = encodeMapping(
                  tBodyParamValue,
                  mappingForEntityBodyForParam,
                );
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      //#endregion

      //#region handle query params
      const queryParamsToProcess = Object.values(
        methodConfig.parameters,
      ).filter(f => f.paramType === 'Query');

      if (queryParamsToProcess.length > 0) {
        const isUsingWholeQueryParamBody = !_.isUndefined(
          queryParamsToProcess.find(c => !c.paramName),
        );

        if (isUsingWholeQueryParamBody && queryParamsToProcess.length > 1) {
          throw new Error(
            `You can use only ONE query param @Query() without name.`,
          );
        }

        if (isUsingWholeQueryParamBody) {
          try {
            const entity = JSON.parse(
              TaonHelpers.firstStringOrElemFromArray(
                req.headers[Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS],
              ) ?? '{}',
            );
            tQuery = TaonHelpers.parseJSONwithStringJSONs(
              encodeMapping(tQuery, entity),
            );
            if (req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM]) {
              //#region handle circular items in query params
              try {
                const circs = JSON.parse(
                  TaonHelpers.firstStringOrElemFromArray(
                    req.headers[Symbols.old.CIRCURAL_OBJECTS_MAP_QUERY_PARAM],
                  ) ?? '{}',
                );
                tQuery = JSON10.applyCircularMapping(tQuery, circs);
              } catch (e) {
                console.error(e);
              }
              //#endregion
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          for (const queryParm of queryParamsToProcess) {
            try {
              const queryParamName = queryParm.paramName;
              const entityForParam = JSON.parse(
                TaonHelpers.firstStringOrElemFromArray(
                  req.headers[
                    `${Symbols.old.MAPPING_CONFIG_HEADER_QUERY_PARAMS}${queryParamName.toLowerCase()}`
                  ],
                ) ?? '{}',
              );
              let beforeTransofrm = tQuery[queryParamName];
              if (_.isString(beforeTransofrm)) {
                try {
                  const paresed =
                    TaonHelpers.tryTransformParam(beforeTransofrm);
                  beforeTransofrm = paresed;
                } catch (e) {}
              }
              const afterEncoding = encodeMapping(
                beforeTransofrm,
                entityForParam,
              );
              tQuery[queryParamName] =
                TaonHelpers.parseJSONwithStringJSONs(afterEncoding);
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
      //#endregion
    }

    //#region set proper arguments for backend function
    Object.keys(methodConfig.parameters).forEach(paramName => {
      let p: Partial<ParamConfig> = methodConfig.parameters[paramName];
      if (p.paramType === 'Path' && tParams) {
        args.push(tParams[p.paramName]);
      }
      if (p.paramType === 'Query' && tQuery) {
        if (p.paramName) {
          args.push(tQuery[p.paramName]);
        } else {
          args.push(tQuery);
        }
      }

      if (p.paramType === 'Header' && req.headers) {
        args.push(req.headers[p.paramName.toLowerCase()]);
      }
      if (p.paramType === 'Cookie' && req.cookies) {
        args.push(req.cookies[p.paramName]);
      }
      if (p.paramType === 'Body' && tBody) {
        if (p.paramName && typeof tBody === 'object') {
          args.push(tBody[p.paramName]);
        } else {
          args.push(tBody);
        }
      }
    });
    //#endregion

    return { args, bodyFormDataFiles };
    //#endregion
  }
  //#endregion

  //#region API / start server
  async startServer(): Promise<void> {
    //#region @backendFunc
    if (
      this.ctx.isRemoteHost ||
      this.ctx.isRunOrRevertOnlyMigrationAppStart ||
      UtilsOs.isRunningInCloudflareWorker()
    ) {
      return;
    }
    if (this.ctx.mode === 'backend-frontend(tcp+udp)') {
      return await new Promise(resolve => {
        if (this.ctx.isRunningInsideDocker) {
          // this.displayRoutes(this.expressApp);
          this.ctx.serverTcpUdp.listen(
            Number(this.ctx.uriPort),
            '0.0.0.0',
            () => {
              this.ctx.logFramework &&
                Helpers.log(
                  `[ctx=${this.ctx.contextName}] Express server (inside docker) started 0.0.0.0:${this.ctx.uriPort}`,
                );
              this.ctx.logFramework &&
                Helpers.log(`[taon][express-server]listening on port: ${this.ctx.uriPort}, hostname: ${this.ctx.uriPathname},
    address: ${this.ctx.uriProtocol}//localhost:${this.ctx.uriPort}${this.ctx.uriPathname}
    ExpressJS mode: ${this.ctx.expressApp.settings.env}
    `);
              resolve(void 0);
            },
          );
        } else {
          // this.displayRoutes(this.expressApp);
          this.ctx.serverTcpUdp.listen(Number(this.ctx.uriPort), () => {
            this.ctx.logFramework &&
              Helpers.log(
                `[ctx=${this.ctx.contextName}] Express server (inside nodejs app) started on localhost:${this.ctx.uriPort}`,
              );
            this.ctx.logFramework &&
              Helpers.log(`[taon][express-server]listening on port: ${this.ctx.uriPort}, hostname: ${this.ctx.uriPathname},
    address: ${this.ctx.uriProtocol}//localhost:${this.ctx.uriPort}${this.ctx.uriPathname}
    expressJS mode: ${this.ctx.expressApp.settings.env}
            `);
            resolve(void 0);
          });
        }
      });
    } else {
      this.ctx.logFramework &&
        Helpers.info('Ipc communication enable instead tcp/upd');
    }
    //#endregion
  }
  //#endregion
}
