import 'reflect-metadata'; // TODO this is needed for my decorators to work

import { RestErrorResponseWrapper } from 'ng2-rest/src';
import * as coreHelpers from 'tnp-core/src';

import * as base from './base-classes/base';
import * as createContextFn from './create-context';
import * as controllerDecorator from './decorators/classes/controller-decorator';
import * as entityDecorator from './decorators/classes/entity-decorator';
import * as middlewareDecorator from './decorators/classes/middleware-decorator';
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
// import * as allSymbols from './symbols';

// export * from './build-info._auto-generated_';
export * from './constants';
export * from './context-db-migrations';
export * from './create-context';
export * from './endpoint-context-storage';
export * from './endpoint-context';
export * from './entity-process';
export * from './get-response-value';
// export * from './index';
export * from './inject';
export * from './models';
export * from './symbols';
export * from './validators';
export * from './base-classes/base-abstract-entity';
export * from './base-classes/base-angular-service';
export * from './base-classes/base-class';
export * from './base-classes/base-context';
export * from './base-classes/base-controller';
export * from './base-classes/base-crud-controller';
export * from './base-classes/base-custom-repository';
export * from './base-classes/base-entity';
export * from './base-classes/base-file-upload.middleware';
export * from './base-classes/base-injector';
export * from './base-classes/base-middleware';
export * from './base-classes/base-migration';
export * from './base-classes/base-provider';
export * from './base-classes/base-repository';
export * from './base-classes/base-subscriber-for-entity';
export * from './config/controller-config';
export * from './config/controller-options';
export * from './config/method-config';
export * from './config/param-config';
export * from './decorators/decorator-abstract-opt';
export * from './dependency-injection/di-container';
export * from './formly/formly-group-wrapper.component'; // @browser
export * from './formly/formly-repeat.component'; // @browser
export * from './formly/formly.models'; // @browser
export * from './formly/fromly'; // @browser
export * from './formly/type-from-entity'; // @browser
export * from './helpers/class-helpers';
export * from './helpers/clone-obj';
export * from './helpers/taon-helpers';
export * from './orm/columns';
export * from './realtime/realtime-client';
export * from './realtime/realtime-core';
export * from './realtime/realtime-server';
export * from './realtime/realtime-subs-manager';
export * from './realtime/realtime.models';
export * from './decorators/classes/controller-decorator';
export * from './decorators/classes/entity-decorator';
export * from './decorators/classes/middleware-decorator';
export * from './decorators/classes/migration-decorator';
export * from './decorators/classes/provider-decorator';
export * from './decorators/classes/repository-decorator';
export * from './decorators/classes/subscriber-decorator';
export * from './decorators/http/http-methods-decorators';
export * from './decorators/http/http-params-decorators';
export * from './realtime/realtime-strategy/realtime-strategy-ipc';
export * from './realtime/realtime-strategy/realtime-strategy-mock';
export * from './realtime/realtime-strategy/realtime-strategy-socket-io';
export * from './realtime/realtime-strategy/realtime-strategy';
export * from './ui/taon-admin-mode-configuration/taon-admin.service'; // @browser
export * from './formly/formly-group-wrapper.component'; // @browser
export * from './formly/formly-repeat.component'; // @browser

export type {
  TaonClientMiddlewareInterceptOptions,
  TaonServerMiddlewareInterceptOptions,
} from 'ng2-rest/src';

// TODO export all things

export namespace Taon {
  /**
   * Remove global taon loader from env.ts [loading.preAngularBootstrap]
   */
  export const removeLoader = (afterMS: number = 0): Promise<void> => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        (globalThis?.window as Window)?.document
          ?.getElementById('taonpreloadertoremove')
          ?.remove();

        const body = (globalThis?.window as Window)?.document?.body;
        if (body && body.style) {
          body.style.backgroundColor = '';
        }
        resolve();
      }, afterMS);
    });
  };

  export const error = (
    opt:
      | Pick<
          RestErrorResponseWrapper,
          'message' | 'status' | 'details' | 'code'
        >
      | string,
  ): void => {
    throw () => {
      if (typeof opt === 'string') {
        opt = {
          message: opt,
        };
      }
      return opt;
    };
  };

  export type ResponseHtml = models.Models.Http.Response<string>;
  export import Response = models.Models.Http.Response;
  // TODO new 5.8 typescript is not allowing this
  // export import Http = http.Http;
  // export import Base = base.Base;
  // export import Orm = orm.Orm;

  export import StartParams = models.Models.StartParams;
  export const getResponseValue = getResponse.getResponseValue;

  //#region class decorators
  // TODO new 5.8 typescript is not allowing this
  // export import Controller = controllerDecorator.TaonController;
  // export import Entity = entityDecorator.TaonEntity;
  // export import Provider = providerDecorator.TaonProvider;
  // export import Repository = repositoryDecorator.TaonRepository;
  // export import Subscriber = subscriberDecorator.TaonSubscriber;
  // export import Migration = migrationDecorator.TaonMigration;
  // export import Middleware = middlewareDecorator.TaonMiddleware;
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

  /**
   * @deprecated
   * use createContext instead
   */
  export const init = async (options: {
    host: string;
    entities: Function[];
    controllers: Function[];
  }) => {
    const TaonBaseContext = (await import('./base-classes/base-context'))
      .TaonBaseContext;
    const context = createContext(() => ({
      appId: 'default-app-not-used-anymore',
      contextName: 'default',
      host: options.host,
      contexts: { TaonBaseContext },
      database: true,
      entities: Array.from(options.entities) as any,
      controllers: Array.from(options.controllers) as any,
    }));

    await context.initialize();
    return context;
  };
}

//#region taon flattening map
export const TAON_FLATTEN_MAPPING = {
  'taon/src': {
    // =====================
    // Taon.Http.*
    // =====================
    'Taon.Http.GET': 'GET',
    'Taon.Http.POST': 'POST',
    'Taon.Http.PUT': 'PUT',
    'Taon.Http.DELETE': 'DELETE',
    'Taon.Http.PATCH': 'PATCH',
    'Taon.Http.HEAD': 'HEAD',
    'Taon.Http.HTML': 'HTML',
    'Taon.Http.Response': 'HttpResponse',

    'Taon.Http.Param.Query': 'Query',
    'Taon.Http.Param.Path': 'Path',
    'Taon.Http.Param.Body': 'Body',
    'Taon.Http.Param.Cookie': 'Cookie',
    'Taon.Http.Param.Header': 'Header',

    // =====================
    // Taon.Base.*
    // =====================
    'Taon.Base.Controller': 'TaonBaseController',
    'Taon.Base.CrudController': 'TaonBaseCrudController',
    'Taon.Base.Entity': 'TaonBaseEntity',
    'Taon.Base.AbstractEntity': 'TaonBaseAbstractEntity',
    'Taon.Base.AbstractEntityOmitKeys': 'AbstractEntityOmitKeys',
    'Taon.Base.Provider': 'TaonBaseProvider',
    'Taon.Base.Class': 'TaonBaseClass',
    'Taon.Base.Repository': 'TaonBaseRepository',
    'Taon.Base.CustomRepository': 'TaonBaseCustomRepository',
    'Taon.Base.SubscriberForEntity': 'TaonBaseSubscriberForEntity',
    'Taon.Base.Migration': 'TaonBaseMigration',
    'Taon.Base.Middleware': 'TaonBaseMiddleware',
    'Taon.Base.AngularService': 'TaonBaseAngularService',
    'Taon.Base.Context': 'TaonBaseContext',

    // =====================
    // Taon.Controller.* (decorators)
    // =====================
    'Taon.Controller': 'TaonController',
    'Taon.Entity': 'TaonEntity',
    'Taon.Provider': 'TaonProvider',
    'Taon.Repository': 'TaonRepository',
    'Taon.Subscriber': 'TaonSubscriber',
    'Taon.Migration': 'TaonMigration',
    'Taon.Middleware': 'TaonMiddleware',

    // =====================
    // Taon.Orm.*
    // =====================
    'Taon.Orm.Repository': 'Repository',
    'Taon.Orm.Connection': 'Connection',

    // ListenEvent
    'Taon.Orm.ListenEvent.AfterInsert': 'AfterInsert',
    'Taon.Orm.ListenEvent.AfterLoad': 'AfterLoad',
    'Taon.Orm.ListenEvent.AfterRecover': 'AfterRecover',
    'Taon.Orm.ListenEvent.AfterRemove': 'AfterRemove',
    'Taon.Orm.ListenEvent.AfterSoftRemove': 'AfterSoftRemove',
    'Taon.Orm.ListenEvent.AfterUpdate': 'AfterUpdate',
    'Taon.Orm.ListenEvent.BeforeInsert': 'BeforeInsert',
    'Taon.Orm.ListenEvent.BeforeRecover': 'BeforeRecover',
    'Taon.Orm.ListenEvent.BeforeRemove': 'BeforeRemove',
    'Taon.Orm.ListenEvent.BeforeSoftRemove': 'BeforeSoftRemove',
    'Taon.Orm.ListenEvent.BeforeUpdate': 'BeforeUpdate',

    // Tree
    'Taon.Orm.Tree.Children': 'TreeChildren',
    'Taon.Orm.Tree.Parent': 'TreeParent',

    // Column
    'Taon.Orm.Column.Generated': 'Generated',
    'Taon.Orm.Column.Primary': 'PrimaryColumn',
    'Taon.Orm.Column.Index': 'Index',
    'Taon.Orm.Column.CreateDate': 'CreateDateColumn',
    'Taon.Orm.Column.UpdateDate': 'UpdateDateColumn',
    'Taon.Orm.Column.DeleteDate': 'DeleteDateColumn',
    'Taon.Orm.Column.Custom': 'Column',

    'Taon.Orm.Column.String': 'StringColumn',
    'Taon.Orm.Column.String100': 'String100Column',
    'Taon.Orm.Column.String45': 'String45Column',
    'Taon.Orm.Column.String500': 'String500Column',
    'Taon.Orm.Column.String200': 'String200Column',
    'Taon.Orm.Column.Number': 'NumberColumn',
    'Taon.Orm.Column.DecimalNumber': 'DecimalNumberColumn',
    'Taon.Orm.Column.SimpleJson': 'SimpleJsonColumn',
    'Taon.Orm.Column.Boolean': 'BooleanColumn',
    'Taon.Orm.Column.DateTIme': 'DateTimeColumn',

    'Taon.Orm.Column.Version': 'VersionColumn',
    'Taon.Orm.Column.Virtual': 'VirtualColumn',

    // Join
    'Taon.Orm.Join.Table': 'JoinTable',
    'Taon.Orm.Join.Column': 'JoinColumn',

    // Relation
    'Taon.Orm.Relation.OneToMany': 'OneToMany',
    'Taon.Orm.Relation.OneToOne': 'OneToOne',
    'Taon.Orm.Relation.ManyToMany': 'ManyToMany',
    'Taon.Orm.Relation.ManyToOne': 'ManyToOne',
  },
  'taon-storage/src': {
    // =====================
    // Stor.* (new clean API)
    // =====================
    'Stor.Property.In.LocalStorage': 'StorPropertyInLocalStorage',
    'Stor.Property.In.IndexedDb': 'StorPropertyInIndexedDb',

    // short alias style (if you prefer this pattern in some codebases)
    'Stor.In.LocalStorage': 'StorPropertyInLocalStorage',
    'Stor.In.IndexedDb': 'StorPropertyInIndexedDb',

    // =====================
    // Stor.property.in.* (back-compat chain you mentioned)
    // =====================
    'Stor.property.in.localstorage': 'StorPropertyInLocalStorage',
    'Stor.property.in.indexedb': 'StorPropertyInIndexedDb',
    'Stor.property.in.indexedDb': 'StorPropertyInIndexedDb',

    // Optional: if your old code had Stor.proper... (typo)
    'Stor.proper.in.localstorage': 'StorPropertyInLocalStorage',
    'Stor.proper.in.indexedb': 'StorPropertyInIndexedDb',
  },
} satisfies Record<string, Record<string, string>>;
//#endregion
