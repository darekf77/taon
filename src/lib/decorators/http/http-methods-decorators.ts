import { ResponseTypeAxios } from 'ng2-rest/src';
import { CoreModels, _ } from 'tnp-core/src';

import { TaonBaseMiddleware } from '../../base-classes/base-middleware';
import { ClassHelpers } from '../../helpers/class-helpers';
import { Models } from '../../models';
import { Symbols } from '../../symbols';

const metaReq = (
  method: CoreModels.HttpMethod,
  path: string,
  target: Function,
  propertyKey: string,
  descriptor: PropertyDescriptor,
  pathOrOptions: string | TaonHttpDecoratorOptions,
  pathIsGlobal: boolean,
) => {
  const methodConfig = ClassHelpers.ensureMethodConfig(target, propertyKey);

  let options: TaonHttpDecoratorOptions;
  if (typeof pathOrOptions === 'object') {
    options = pathOrOptions;
    pathOrOptions = options.path as any;
    pathIsGlobal = !!options.pathIsGlobal;
    path = options.path;
  } else {
    options = { pathOrOptions, pathIsGlobal } as any;
  }

  const {
    overrideContentType,
    overrideResponseType,
    overrideExpressSendAsHtml,
    middlewares,
  } = options;

  methodConfig.methodName = propertyKey;
  methodConfig.middlewares = middlewares;
  methodConfig.type = method;
  if (!path) {
    let paramsPathConcatedPath = '';
    for (const key in methodConfig.parameters) {
      if (methodConfig.parameters.hasOwnProperty(key)) {
        const element = methodConfig.parameters[key];
        if (
          element.paramType === 'Path' &&
          _.isString(element.paramName) &&
          element.paramName.trim().length > 0
        ) {
          paramsPathConcatedPath += `/${element.paramName}/:${element.paramName}`;
        }
      }
    }
    methodConfig.path = `/${propertyKey}${paramsPathConcatedPath}`;
  } else {
    methodConfig.path = path;
  }

  methodConfig.descriptor = descriptor;
  methodConfig.global = pathIsGlobal;
  methodConfig.contentType = overrideContentType;
  methodConfig.responseType = overrideResponseType;
  methodConfig.overrideExpressSendAsHtml = overrideExpressSendAsHtml;
};

export type TaonMiddlewareInheritanceObj = {
  [parentMiddlewaresName: string]: typeof TaonBaseMiddleware;
};

export type TaonMiddlewareFunction = (options: {
  /**
   * middlewares inherited from parent class
   */
  parentMiddlewares: TaonMiddlewareInheritanceObj;
  /**
   * Get real class name - needed when code is minified
   */
  className: (middlewareClass: Function) => string;
}) => TaonMiddlewareInheritanceObj;

export interface TaonHttpDecoratorOptions {
  /**
   * @deprecated don't use in production - keep stuff encapsulated
   * normally path is generated from method name and its params
   */
  path?: string;
  /**
   * If true, the path will be global
   *
   * ! BE CAREFUL ! global path IS NOT GLOBAL inside dockerized app
   * (/api/contextName is automatically added to global path in docker)
   *
   * @deprecated don't use in production - keep stuff encapsulated
   */
  pathIsGlobal?: boolean;
  overrideContentType?: CoreModels.ContentType;
  overrideResponseType?: ResponseTypeAxios;
  /**
   * Express will send response as HTML string with proper headers
   */
  overrideExpressSendAsHtml?: boolean;
  middlewares?: TaonMiddlewareFunction;
}

export function GET(
  pathOrOptions?: string | TaonHttpDecoratorOptions,
  pathIsGlobal = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    metaReq(
      'get',
      pathOrOptions as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      pathIsGlobal,
    );
  };
}

/**
 * Method for sending html website from text
 * Example
 *
 * ```ts
 * ...
 * // in your taon controller
 * ..Taon.Http.HTML()
 * sendHtmlDummyWebsite(): Taon.ResponseHtml {
 *  return  `
      <html>
        <head>
          <title>Dummy website</title>
        </head>
        <body>
          <h1>This is dummy website</h1>
          <p>Served as HTML string from Taon controller method</p>
        </body>
      </html>
 *  `; *
 * }
 * ...
 * ```
 */
export function HTML(
  pathOrOptions?: Pick<TaonHttpDecoratorOptions, 'path' | 'pathIsGlobal'>,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const opt = pathOrOptions as TaonHttpDecoratorOptions;
    opt.overrideExpressSendAsHtml = true;
    metaReq(
      'get',
      opt as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      opt.pathIsGlobal,
    );
  };
}

export function HEAD(
  pathOrOptions?: string | TaonHttpDecoratorOptions,
  pathIsGlobal = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    metaReq(
      'head',
      pathOrOptions as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      pathIsGlobal,
    );
  };
}

export function POST(
  pathOrOptions?: string | TaonHttpDecoratorOptions,
  pathIsGlobal = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    metaReq(
      'post',
      pathOrOptions as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      pathIsGlobal,
    );
  };
}

export function PUT(
  pathOrOptions?: string | TaonHttpDecoratorOptions,
  pathIsGlobal = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    metaReq(
      'put',
      pathOrOptions as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      pathIsGlobal,
    );
  };
}

export function PATCH(
  pathOrOptions?: string | TaonHttpDecoratorOptions,
  pathIsGlobal = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    metaReq(
      'patch',
      pathOrOptions as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      pathIsGlobal,
    );
  };
}

export function DELETE(
  pathOrOptions?: string | TaonHttpDecoratorOptions,
  pathIsGlobal = false,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    metaReq(
      'delete',
      pathOrOptions as string,
      target,
      propertyKey,
      descriptor,
      pathOrOptions,
      pathIsGlobal,
    );
  };
}
