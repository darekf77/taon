//#region @backend
export { config } from './build/config';
export { FILE_NAME_ISOMORPHIC_PACKAGES } from './build/packages-recognition';
export {
  CodeCut, BrowserCodeCut, TsUsage, IncrementalBuildProcess, PackagesRecognition,
  BroswerCompilation, OutFolder, BackendCompilation
} from './build';

//#endregion

export { ModelDataConfig, MDC } from './crud/model-data-config';
export { Helpers } from './helpers';
export { Models } from './models';
export { RepeatTypeComponent } from './crud/formly-repeat-component';
export { FormlyHorizontalWrapper } from './crud/formly-group-wrapper-component';
export { Log, Level } from 'ng2-logger';

import * as crudMorph from './crud';
import * as decoratorsMorphi from './decorators';
import * as framework from './framework';
import * as realtime from './realtime';
import * as models from './models';
import * as sym from './symbols';
import * as helpers from './helpers';
import { FrameworkContext } from './framework/framework-context';
import * as context from './framework/framework-context';

//#region @backend
import { generate } from 'password-hash';
import * as pass from 'passport';
import * as tsorm from 'typeorm'
import { Handler } from 'express'
export * from './build-tool';
//#endregion

//#region @backend
import { Repository } from 'typeorm';
//#endregion

export class TypeormRepository<T>
  //#region @backend
  extends Repository<T>
//#endregion
{

}


export namespace Morphi {
  export const IsNode = helpers.Helpers.isNode;
  export const IsBrowser = helpers.Helpers.isBrowser;

  export const isNode = helpers.Helpers.isNode;
  export const isBrowser = helpers.Helpers.isBrowser;
  export import FrameworkContext = context.FrameworkContext;
  export function destroyContext(context: FrameworkContext) {
    FrameworkContext.destroy(context)
  }

  export function getHttpPathBy<T = Function>(classFn: new () => T, port: number, method: (keyof T)) {
    return `http://localhost:${port}${helpers.Helpers.getPathFor(classFn as any)}/${method}`;
  }

  /**
   * Header name for model data config
   */
  export const MDC_KEY = sym.SYMBOL.MDC_KEY;
  export const Platform = IsNode ? 'node' : 'browser';

  export const Providers: Function[] = FrameworkContext.Providers;

  export import Response = models.Models.Response;


  export import Controller = framework.Controller;
  export import Entity = framework.Entity;
  //#region @backend
  export import BASE_CONTROLLER_INIT = framework.BASE_CONTROLLER_INIT;
  export import Repository = framework.Repository;
  export const getResponseValue = helpers.Helpers.getResponseValue;

  // export const authenticate = pass.authenticate
  //#endregion
  export import init = framework.start;
  export import SYMBOL = sym.SYMBOL;

  export namespace Realtime {
    export namespace Browser {
      export const SubscribeEntityChanges = realtime.RealtimeBrowser.SubscribeEntityChanges;
      export const SubscribeEntityPropertyChanges = realtime.RealtimeBrowser.SubscribeEntityPropertyChanges;
      export const UnsubscribeEverything = realtime.RealtimeBrowser.UnsubscribeEverything;
      export const UnsubscribeEntityChanges = realtime.RealtimeBrowser.UnsubscribeEntityChanges;
      export const UnsubscribeEntityPropertyChanges = realtime.RealtimeBrowser.UnsubscribeEntityPropertyChanges;
    }

    //#region @backend
    export namespace Server {
      export const TrigggerEntityChanges = realtime.RealtimeNodejs.TrigggerEntityChanges;
      export const TrigggerEntityPropertyChanges = realtime.RealtimeNodejs.TrigggerEntityPropertyChanges;
    }
    //#endregion
  }

  export namespace CRUD {
    export import ModelDataConfig = crudMorph.ModelDataConfig;
    export import Base = crudMorph.BaseCRUD;
  }

  export namespace Formly {
    export import getFrom = crudMorph.getFromlyConfigFor;
    export import RegisterComponentForEntity = crudMorph.RegisterComponentTypeForEntity;
  }

  export namespace Base {
    export import Controller = framework.BASE_CONTROLLER;
    export import Entity = framework.BASE_ENTITY;
    //#region @backend
    export import Repository = framework.BASE_REPOSITORY;
    //#endregion
  }

  export namespace Http {
    export import GET = decoratorsMorphi.GET;
    export import POST = decoratorsMorphi.POST;
    export import PUT = decoratorsMorphi.PUT;
    export import DELETE = decoratorsMorphi.DELETE;
    export import PATCH = decoratorsMorphi.PATCH;
    export import HEAD = decoratorsMorphi.HEAD;
    export namespace Param {
      export import Query = decoratorsMorphi.Query;
      export import Path = decoratorsMorphi.Path;
      export import Body = decoratorsMorphi.Body;
      export import Cookie = decoratorsMorphi.Cookie;
      export import Header = decoratorsMorphi.Header;
    }
    export namespace Resopnse {
      export import Success = models.Models.Rest.HttpResponse;
      export import Error = models.Models.Rest.HttpResponseError;
    }
  }

  export namespace Auth {
    //#region @backend
    export namespace Password {
      export namespace Hash {
        export const Generate = generate;
      }
    }
    //#endregion
  }


  export namespace Orm {
    export const Repository = TypeormRepository;
    //#region @backend
    export import getConnection = tsorm.getConnection;
    export import Errors = models.Models.Errors;
    export import Connection = tsorm.Connection;
    export import CreateConnection = tsorm.createConnection;
    export import TableNameFrom = framework.tableNameFrom;
    export import RepositoryFrom = framework.repositoryFrom

    export namespace Tree {
      export import Children = tsorm.TreeChildren;
      export import Parent = tsorm.TreeParent;
    }
    export namespace Column {
      export import Generated = tsorm.PrimaryGeneratedColumn;
      export import Primary = tsorm.PrimaryColumn;
      export import CreateDate = tsorm.CreateDateColumn;
      export import Custom = tsorm.Column;
    }

    export namespace Join {
      export import Table = tsorm.JoinTable;
      export import Column = tsorm.JoinColumn;
    }
    export namespace Relation {
      export import OneToMany = tsorm.OneToMany;
      export import OneToOne = tsorm.OneToOne;
      export import ManyToMany = tsorm.ManyToMany;
      export import ManyToOne = tsorm.ManyToOne;
    }
    //#endregion
  }



}
