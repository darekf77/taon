import 'reflect-metadata'; // TODO this is needed for my decorators to work
import { NgZone } from '@angular/core'; // @browser
import * as coreHelpers from 'tnp-core/src';

import * as base from './base-classes/base';
import * as createContextFn from './create-context';
import * as controllerDecorator from './decorators/classes/controller-decorator';
import * as entityDecorator from './decorators/classes/entity-decorator';
import * as migrationDecorator from './decorators/classes/migration-decorator';
import * as providerDecorator from './decorators/classes/provider-decorator';
import * as repositoryDecorator from './decorators/classes/repository-decorator';
import * as subscriberDecorator from './decorators/classes/subscriber-decorator';
import * as http from './decorators/http/http-decorators';
import * as endpointContext from './endpoint-context';
import * as getResponse from './get-response-value';
import * as injectFn from './inject';
import * as models from './models';
import * as orm from './orm';
import * as allSymbols from './symbols';

export * from './ui';

export { EndpointContext } from './endpoint-context';
export { BaseRepository } from './base-classes/base-repository';
export { BaseController } from './base-classes/base-controller';
export { BaseProvider } from './base-classes/base-provider';
export { BaseEntity } from './base-classes/base-entity';
export { BaseContext } from './base-classes/base-context';
export { BaseMigration } from './base-classes/base-migration';
export { createContext, TaonContext } from './create-context';
export { inject } from './inject';
export { Models } from './models';
export * from './constants';
export { ClassHelpers } from './helpers/class-helpers';
// TODO export all things

export namespace Taon {
  export import Response = models.Models.Http.Response;
  export import Http = http.Http;
  export import Base = base.Base;
  export import Orm = orm.Orm;
  export import StartParams = models.Models.StartParams;
  export const getResponseValue = getResponse.getResponseValue;

  //#region class decorators
  export import Controller = controllerDecorator.TaonController;
  export import Entity = entityDecorator.TaonEntity;
  export import Provider = providerDecorator.TaonProvider;
  export import Repository = repositoryDecorator.TaonRepository;
  export import Subscriber = subscriberDecorator.TaonSubscriber;
  export import Migration = migrationDecorator.TaonMigration;
  //#endregion
  //#region aliases to helpers
  export const isBrowser = coreHelpers.Helpers.isBrowser;
  export const isNode = coreHelpers.Helpers.isNode;
  export const isWebSQL = coreHelpers.Helpers.isWebSQL;
  export const isElectron = coreHelpers.Helpers.isElectron;
  //#endregion
  export const createContext = createContextFn.createContext;
  export const createContextTemplate = createContextFn.createContextTemplate;

  export const inject = injectFn.inject;

  //#region @browser
  export const initNgZone = (ngZone: NgZone) => {
    endpointContext.EndpointContext.initNgZone(ngZone);
  };
  //#endregion

  export const symbols = allSymbols.Symbols;

  /**
   * @deprecated
   * use createContext instead
   */
  export const init = async (options: {
    host: string;
    entities: Function[];
    controllers: Function[];
  }) => {
    const BaseContext = (await import('./base-classes/base-context'))
      .BaseContext;
    const context = createContext(() => ({
      contextName: 'default',
      host: options.host,
      contexts: { BaseContext },
      database: true,
      entities: Array.from(options.entities) as any,
      controllers: Array.from(options.controllers) as any,
    }));

    await context.initialize();
    return context;
  };
}
