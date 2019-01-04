import * as crudMorph from './crud';
export { ModelDataConfig } from './crud/model-data-config';
import * as decoratorsMorphi from './decorators';
import * as framework from './framework';
import * as global from './global-config';
import * as models from './models';
import * as sym from './symbols';
import * as helpers from './helpers';
import * as initDeco from './init';
import * as isom from './isomorphic-replacements';
import { generate } from "password-hash";


//#region @backend
import * as pass from 'passport';
import * as tsorm from 'typeorm'
import { Handler } from 'express'
export * from './build-tool';
//#endregion



export namespace Morphi {
  export const IsNode = helpers.Helpers.isNode;
  export const IsBrowser = helpers.Helpers.isBrowser;
  export const Config = global.Global.vars;
  export const Platform = IsNode ? 'node' : 'browser';
  export const Providers: Function[] = initDeco.Providers as any;

  export import Response = models.Models.Response;


  export import Service = framework.Service;
  export import Controller = framework.Controller;
  export import Entity = framework.Entity;
  //#region @backend
  export import Repository = framework.Repository;
  export const getResponseValue = helpers.Helpers.getResponseValue;

  // export const authenticate = pass.authenticate
  //#endregion
  export import init = framework.start;
  export import SYMBOL = sym.SYMBOL;

  export namespace CRUD {
    export import ModelDataConfig = crudMorph.ModelDataConfig;
    export import Base = crudMorph.BaseCRUD
    export import getFormlyFrom = crudMorph.getFromlyConfigFor;
  }

  export namespace Base {
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
    export import Repository = isom.TypeormRepository;
    //#region @backend
    export import getConnection = tsorm.getConnection;
    export import Errors = models.Models.Errors;
    export import InjectConnection = decoratorsMorphi.OrmConnection;
    export import Connection = tsorm.Connection;
    export import CreateConnection = tsorm.createConnection;
    export import TableNameFrom = framework.tableNameFrom;
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
