import { CoreModels, _ } from 'tnp-core/src';
import { Models } from '../../models';
import { Symbols } from '../../symbols';
import { Models as ModelsNg2Rest } from 'ng2-rest/src';
const metaReq = (
  method: Models.Http.Rest.HttpMethod,
  path: string,
  target: Function,
  propertyKey: string,
  descriptor: PropertyDescriptor,
  pathOrOptions: string | TaonHttpDecoratorOptions,
  pathIsGlobal: boolean,
) => {
  let options: TaonHttpDecoratorOptions;
  if (typeof pathOrOptions === 'object') {
    options = pathOrOptions;
    pathOrOptions = options.path as any;
    pathIsGlobal = !!options.pathIsGlobal;
    path = options.path;
  } else {
    options = { pathOrOptions, pathIsGlobal } as any;
  }

  const { overrideContentType, overridResponseType } = options;

  let methodConfig: Models.MethodConfig = Reflect.getMetadata(
    Symbols.metadata.options.controllerMethod,
    target.constructor,
    propertyKey,
  );
  if (!methodConfig) {
    methodConfig = new Models.MethodConfig();
    Reflect.defineMetadata(
      Symbols.metadata.options.controllerMethod,
      methodConfig,
      target.constructor,
      propertyKey,
    );
  }

  methodConfig.methodName = propertyKey;
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
  methodConfig.responseType = overridResponseType;
  Reflect.defineMetadata(
    Symbols.metadata.options.controllerMethod,
    methodConfig,
    target.constructor,
    propertyKey,
  );
  // console.log('methods updated', methodConfig);
};

export interface TaonHttpDecoratorOptions {
  path?: string;
  pathIsGlobal?: boolean;
  overrideContentType?: CoreModels.ContentType;
  overridResponseType?: ModelsNg2Rest.ResponseTypeAxios;
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
