import * as ng2Logger from 'ng2-logger';
import * as ng2Rest from 'ng2-rest';
import * as tsorm from 'typeorm'
import * as crudMorph from './crud';
import * as decoratorsMorphi from './decorators';
import * as framework from './framework';
import * as global from './global-config';
import * as models from './models';

//#region @backend
export * from './build-tool';
//#endregion



export namespace Morphi {
  export import IsNode = ng2Logger.isNode;
  export import IsBrowser = ng2Logger.isBrowser;
  export const Config = global.Global.vars;
  export const Platform = IsNode ? 'node' : 'browser';
  export import Response = models.Response;

  export import Controller = framework.Controller;
  export import Entity = framework.Entity;
  //#region @backend
  export import Repository = framework.Repository;
  //#endregion
  export import init = framework.start;
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
