import 'reflect-metadata';
import * as http from './decorators/http/http-decorators';
import * as base from './base-classes/base';
import * as controllerDecorator from './decorators/classes/controller-decorator';
import * as entityDecorator from './decorators/classes/entity-decorator';
import * as providerDecorator from './decorators/classes/provider-decorator';
import * as createContextFn from './create-context';
import * as orm from './orm';
import * as models from './models';
import * as coreHelpers from 'tnp-core/src';
import * as injectFn from './inject';
import * as endpointContext from './endpoint-context';
import * as allSymbols from './symbols';
//#region @browser
import { NgZone } from '@angular/core';
import { from } from 'form-data';

//#endregion

export { BaseRepository } from './base-classes/base-repository';
export { BaseController } from './base-classes/base-controller';
export { BaseProvider } from './base-classes/base-provider';
export { BaseEntity } from './base-classes/base-entity';
export { BaseContext } from './base-classes/base-context';
export { createContext } from './create-context';
export { inject } from './inject';
export { Models } from './models';
export * from './constants';
export { ClassHelpers } from './helpers/class-helpers';
// TODO export all things

export namespace Firedev {
  export import Response = models.Models.Http.Response;
  export import Http = http.Http;
  export import Base = base.Base;
  export import Orm = orm.Orm;

  //#region class decorators
  export import Controller = controllerDecorator.FiredevController;
  export import Entity = entityDecorator.FiredevEntity;
  export import Provider = providerDecorator.FiredevProvider;
  //#endregion
  //#region aliases to helpers
  /**
   * @deprecated
   */
  export const isBrowser = coreHelpers.Helpers.isBrowser;
  /**
   * @deprecated
   */
  export const isNode = coreHelpers.Helpers.isNode;
  /**
   * @deprecated
   */
  export const isWebSQL = coreHelpers.Helpers.isWebSQL;
  /**
   * @deprecated
   */
  export const isElectron = coreHelpers.Helpers.isElectron;
  //#endregion
  export const createContext = createContextFn.createContext;

  export const inject = injectFn.inject;

  //#region @browser
  export const initNgZone = (ngZone: NgZone) => {
    endpointContext.EndpointContext.initNgZone(ngZone);
  };
  export const symbols = allSymbols.Symbols.old;

  /**
   * @deprecated
   * use createContext instead
   */
  export const init = async (options: {
    host: string;
    config?: any;
    entities: Function[];
    controllers: Function[];
  }) => {
    const BaseContext = (await import('./base-classes/base-context'))
      .BaseContext;
    const context = createContext({
      contextName: 'default',
      host: options.host,
      contexts: { BaseContext },
      database: options.config,
      entities: Array.from(options.entities) as any,
      controllers: Array.from(options.controllers) as any,
    });

    await context.initialize();
    return context;
  };
  //#endregion
}
