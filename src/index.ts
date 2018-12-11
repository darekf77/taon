import * as ng2Logger from 'ng2-logger';
import * as ng2Rest from 'ng2-rest';
import * as crudMorph from './crud';
export { ModelDataConfig } from './crud/model-data-config';
import * as decoratorsMorphi from './decorators';
import * as framework from './framework';
import * as global from './global-config';
import * as models from './models';
import * as sym from './symbols';

export * from './helpers';

//#region @backend
import * as pass from 'passport';
import * as tsorm from 'typeorm'
import { Handler } from 'express'
export * from './build-tool';
//#endregion


export namespace Morphi {
  export import IsNode = ng2Logger.isNode;
  export import IsBrowser = ng2Logger.isBrowser;
  export const Config = global.Global.vars;
  export const Platform = IsNode ? 'node' : 'browser';
  export const Providers: Function[] = decoratorsMorphi.Providers as any;

  export import Response = models.Response;
  export import Service = framework.Service;
  export import Controller = framework.Controller;
  export import Entity = framework.Entity;
  //#region @backend
  export import Repository = framework.Repository;
  // export const authenticate = pass.authenticate
  //#endregion
  export import init = framework.start;
  export import SYMBOL = sym.SYMBOL;

  export namespace CRUD {
    export import ModelDataConfig = crudMorph.ModelDataConfig;
    export import Base = crudMorph.BaseCRUD
    export import getFormlyFrom = crudMorph.getFormlyFrom;
  }

  export namespace Base {
    export import InjectCRUDEntity = decoratorsMorphi.BaseCRUDEntity
    export import Controller = framework.BASE_CONTROLLER;
    export import Entity = framework.BASE_ENTITY;
    export import Service = framework.BASE_SERVICE;
    //#region @backend
    export import Repository = framework.BASE_REPOSITORY;
    //#endregion
  }

  export namespace Http {
    export import GET = decoratorsMorphi.GET;
    export import POST = decoratorsMorphi.POST;
    export import PUT = decoratorsMorphi.PUT;
    export import DELETE = decoratorsMorphi.DELETE;
    export namespace Param {
      export import Query = decoratorsMorphi.Query;
      export import Path = decoratorsMorphi.Path;
      export import Body = decoratorsMorphi.Body;
      export import Cookie = decoratorsMorphi.Cookie;
      export import Header = decoratorsMorphi.Header;
    }
  }

  //#region @backend
  export namespace Orm {
    export import Errors = models.Errors;
    export import InjectConnection = decoratorsMorphi.OrmConnection;
    export import Connection = tsorm.Connection;
    export import CreateConnection = tsorm.createConnection;
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
  }
  //#endregion


}
