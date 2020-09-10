import type { FrameworkContext } from './framework-context';
import { Application } from 'express';
import * as _ from 'lodash';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as express from 'express';
import * as http from 'http';
import { SYMBOL } from '../symbols';
import * as  cors from 'cors';
import * as bodyParser from 'body-parser';
import * as errorHandler from 'errorhandler';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as fileUpload from 'express-fileupload';
import { createConnection, createConnections, getConnection } from 'typeorm';
import { Connection } from 'typeorm';
import { CLASS } from 'typescript-class-helpers';
import { Models } from '../models';
import { Helpers } from '../helpers';
import { FrameworkContextBase } from './framework-context-base';
import type { BASE_CONTROLLER } from './framework-controller';
import { Http2Server } from 'http2';
import { RealtimeNodejs } from '../realtime';

export class FrameworkContextNodeApp extends FrameworkContextBase {
  public readonly app: Application;
  public readonly httpServer: Http2Server;
  public readonly connection: Connection;
  constructor(private context: FrameworkContext) {
    super();
    if (context.onlyForBackendRemoteServerAccess) {
      this.app = {} as any;
    } else {
      if (!this.app) {
        this.app = express()
        this.initMidleware();
      }
    }

    // if (uri.pathname !== '/') {
    //   console.log('INT EXPRESS BASE')
    //   Global.vars.app.set('base', uri.pathname)
    // }
    if (!context.onlyForBackendRemoteServerAccess) {
      const h = new http.Server(this.app); //TODO is this working ?
      this.httpServer = h;

      if (!context.testMode) {
        h.listen(context.uri.port, function () {
          console.log(`Server listening on port: ${context.uri.port}, hostname: ${context.uri.pathname},
            env: ${this.app.settings.env}
            `);
        });
      }
    }
    this.initDecoratorsFunctions();
    if (!this.context.onlyForBackendRemoteServerAccess) {
      this.writeActiveRoutes(this.context.workerMode);
    }

    if (!context.onlyForBackendRemoteServerAccess) {
      this.context.publicAssets.forEach(asset => {
        this.app.use(asset.path, express.static(asset.location))
      });
    }

  }

  private async initConnection() {

    if (this.context.mode === 'backend/frontend' || this.context.mode === 'tests') {
      try {
        const con = await getConnection();

        const connectionExists = !!(con);
        if (connectionExists) {
          console.log('Connection exists')
          await con.close()
        }
      } catch (error) { };

      const connections = await createConnections([this.context.config] as any);
      // @ts-ignore
      this.connection = connections[0];
    }

  }

  async init() {
    await this.initConnection();
    if (!this.context.onlyForBackendRemoteServerAccess) {
      return;
    }
    const singletons: BASE_CONTROLLER<any>[] = this.context
      .controllersSingletons
      .filter(f => _.isFunction((f as BASE_CONTROLLER<any>).initExampleDbData)) as any;

    for (let index = 0; index < singletons.length; index++) {
      const singleton = singletons[index];
      await singleton.initExampleDbData(this.context.workerMode);
    }
  }

  readonly realtime: RealtimeNodejs;
  initRealtime() {
    // @ts-ignore
    this.realtime = new RealtimeNodejs(this.context);
  }

  private initDecoratorsFunctions() {
    this.context.initFunc.filter(e => {
      const currentCtrl = this.context.controllers.find(ctrl => ctrl === e.target);
      if (currentCtrl) {
        e.initFN();

        (function (controller: Function) {
          const c = CLASS.getConfig(currentCtrl)[0];

          c.injections.forEach(inj => {
            Object.defineProperty(controller.prototype, inj.propertyName, { get: inj.getter as any });
          });
          CLASS.setSingletonObj(controller, new (controller as any)());

          // Helpers.isBrowser && console.log(`[morphi] Singleton cleated for "${controller && controller.name}"`, CLASS.getSingleton(controller))
        })(currentCtrl);

      }
    });

  }

  public activeRoutes: { routePath: string; method: Models.Rest.HttpMethod }[] = []

  private writeActiveRoutes(isWorker = false) {
    const routes = this.activeRoutes.map(({ method, routePath }) => {
      return `${method.toUpperCase()}:    ${this.context.uri.href.replace(/\/$/, '')}${routePath}`
    });
    const singletonClass = _.first(this.context.controllers) as any;
    const singleton = singletonClass && Helpers.getSingleton(singletonClass as any) as any;
    fse.writeJSONSync(path.join(process.cwd(), `tmp-routes${isWorker ? '--worker--'
      + path.basename(singleton.filename).replace(/\.js$/, '')
      : ''}.json`), routes, {
      spaces: 2,
      encoding: 'utf8'
    })
  }

  private initMidleware() {
    const app = this.app;
    app.use(fileUpload())
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(cors());

    (() => {
      app.use((req, res, next) => {

        res.set('Access-Control-Expose-Headers',
          [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            SYMBOL.X_TOTAL_COUNT,
            SYMBOL.MAPPING_CONFIG_HEADER,
            SYMBOL.CIRCURAL_OBJECTS_MAP_BODY,
            SYMBOL.CIRCURAL_OBJECTS_MAP_QUERY_PARAM
          ].join(', '))
        next();
      });
    })()

  }

}
