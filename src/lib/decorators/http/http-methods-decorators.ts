import { Models as ModelsNg2Rest } from 'ng2-rest/src';
import { CoreModels, _ } from 'tnp-core/src';

import { BaseMiddleware } from '../../base-classes/base-middleware';
import { ClassHelpers } from '../../helpers/class-helpers';
import { Models } from '../../models';
import { Symbols } from '../../symbols';

const metaReq = (
  method: Models.Http.Rest.HttpMethod,
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

  const { overrideContentType, overrideResponseType, middlewares } = options;

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
};

export type TaonMiddlewareInheritanceObj = {
  [parentMiddlewaresName: string]: typeof BaseMiddleware;
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
   * path is global in express app
   * ! BE CAREFUL ! global path IS NOT GLOBAL inside dockerized app
   *  (/api/contextName is automatically added to global path in docker)
   */
  path?: string;
  /**
   * ! BE CAREFULL
   * If true, the path will be global
   */
  pathIsGlobal?: boolean;
  overrideContentType?: CoreModels.ContentType;
  overrideResponseType?: ModelsNg2Rest.ResponseTypeAxios;
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
