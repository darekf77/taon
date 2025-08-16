import type crypto from 'crypto';

import type express from 'express';
import type multer from 'multer';

import { ClassHelpers } from '../../helpers/class-helpers';
import { Models } from '../../models';
import { Symbols } from '../../symbols';

/**
 * Controller decorator
 */
export function TaonController<ControllerClass = any>(
  controllerOptions?: TaonControllerOptions<ControllerClass>,
) {
  return function (constructor: Function) {
    ClassHelpers.setName(constructor, controllerOptions?.className);
    Reflect.defineMetadata(
      Symbols.metadata.options.controller,
      controllerOptions,
      constructor,
    );
    Reflect.defineMetadata(
      Symbols.metadata.className,
      controllerOptions?.className || constructor.name,
      constructor,
    );
  };
}

export type TaonFileUploadMethodConfig = {
  (options: {
    multer?: typeof multer;
    crypto: typeof crypto;
    cwd?: string;
    expressPath?: string;
  }): express.RequestHandler;
};

export type TaonFileUploadOptionsObj<ControllerClass> = {
  [methodName in keyof Partial<ControllerClass>]: TaonFileUploadMethodConfig;
};

export type TaonFileUploadOptions<ControllerClass> =
  | false
  | {
      [methodName in keyof Partial<ControllerClass>]:
        | false
        | TaonFileUploadMethodConfig;
    };

export class TaonControllerOptions<
  ControllerClass = any,
> extends Models.DecoratorAbstractOpt {
  /**
   * typeorm realtime subscribtion // TODO disabled for now, does not make sense ?s
   */
  realtime?: boolean;
  /**
   * override default path for controller api
   */
  path?: string;

  /**
   * enable or diable file upload for controller
   * Provide boolean or multer options for each method
   */
  fileUpload?: TaonFileUploadOptions<ControllerClass>;
}
