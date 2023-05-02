import type { FrameworkContext } from './framework-context';
import { Log, Level } from 'ng2-logger';
//#region @websql
import type { Application } from 'express';
//#endregion
//#region @backend
import * as express from 'express';
import * as expressSession from 'express-session';
import * as  cors from 'cors';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as methodOverride from 'method-override';
import * as fileUpload from 'express-fileupload';
import { Http2Server } from 'http2';
//#endregion
import { Helpers, _ } from 'tnp-core';
//#region @websql
import { path } from 'tnp-core';
//#endregion
//#region @backend
import {
  fse,
  http,
} from 'tnp-core';
//#endregion

import { SYMBOL } from '../symbols';
//#region @websql
import { createConnections, getConnection, DataSource } from 'firedev-typeorm';
import type {
  TransactionRollbackEvent, TransactionCommitEvent, TransactionStartEvent,
  RecoverEvent, SoftRemoveEvent, RemoveEvent, UpdateEvent, InsertEvent
} from 'typeorm';
import { Connection } from 'firedev-typeorm';
//#endregion
import { CLASS } from 'typescript-class-helpers';
import { Models } from '../models';
import { FrameworkContextBase } from './framework-context-base';
import type { BASE_CONTROLLER } from './framework-controller';

import { RealtimeNodejs } from '../realtime';
import { MorphiHelpers } from '../helpers';
import { ISession, ISessionExposed } from './framework-models';


const log = Log.create('context node app',
  Level.__NOTHING
)

export class FrameworkContextNodeApp extends FrameworkContextBase {
  //#region @websql
  public readonly app: Application;
  //#endregion

  public readonly httpServer
    //#region @backend
    : Http2Server;
  //#endregion
  public readonly connection: Connection | DataSource;
  readonly realtime: RealtimeNodejs;
  constructor(private context: FrameworkContext) {
    super();
  }

  private async initConnection() {

    if (this.context.mode === 'backend/frontend' || this.context.mode === 'tests'
      //#region @websqlOnly
      ||
      this.context.mode === 'websql/backend-frontend'
      //#endregion
    ) {

      if (Helpers.isWebSQL) {
        //#region @websqlOnly

        log.info('PREPARING WEBSQL TYPEORM CONNECTION')
        log.d(this.context.config)
        try {
          // @ts-ignore
          const connection = new DataSource(this.context.config);
          // @ts-ignore
          this.connection = connection;
          await this.connection.initialize();
          let admin: any;
          if (Helpers.isBrowser) {
            //#region @browser
            const win = window['firedev'];
            admin = win?.db?.register(this.context);
            //#endregion
          }
          // console.log('this.connection.isInitialized', this.connection.isInitialized)
        } catch (error) {
          Helpers.error(error, false, true)

        }
        //#endregion

        //#region websql with only one connection
        // //#region @websqlOnly
        // try {
        //   if (!FrameworkContextNodeApp.firstConnection) {
        //     // @ts-ignore
        //     const con = new DataSource(this.context.config);
        //     // @ts-ignore
        //     FrameworkContextNodeApp.firstConnection = con;
        //     await FrameworkContextNodeApp.firstConnection.initialize();
        //   }
        //   // @ts-ignore
        //   this.connection = FrameworkContextNodeApp.firstConnection
        // } catch (error) { };
        // //#endregion
        //#endregion
      } else {

        log.info('PREPARING BACKEND TYPEORM CONNECTION')
        log.d(this.context.config)
        try {
          // @ts-ignore
          const connection = new DataSource(this.context.config);
          // @ts-ignore
          this.connection = connection;
          await this.connection.initialize();
          log.i('this.connection.isInitialized', this.connection.isInitialized)

        } catch (error) {
          Helpers.error(error, false, true)
          process.exit(1)
        }
        //#region old way
        // try {
        //   const con = await getConnection();

        //   const connectionExists = !!(con);
        //   if (connectionExists) {
        //     console.log('Connection exists')
        //     await con.close()
        //   }
        // } catch (error) { };

        // const connections = await createConnections([this.context.config] as any);
        // // @ts-ignore
        // this.connection = connections[0];
        //#endregion
      }
    }
    if (!this.connection.isInitialized) {
      console.log(this.connection);
      Helpers.error('Something wrong with connection init', false, true)
    }
    log.info(`PREPARING TYPEORM CONNECTION DONE. initialize=${this.connection.isInitialized}`)

  }


  private entitiesTriggers = {};

  initSubscribers() {
    //#region @websql
    const entities = this.context.entitiesClasses;
    for (let index = 0; index < entities.length; index++) {
      const Entity = entities[index];

      const className = CLASS.getName(Entity);
      this.entitiesTriggers[className] = _.debounce(() => {
        this.context.node.realtime.TrigggerEntityTableChanges(Entity);
      }, 1000);

      const notifyFn = (nameOfEvent, entityData) => {
        // console.log('trigger table event: ',nameOfEvent)
        this.entitiesTriggers[className]();
      };

      //#region sub
      const sub = {
        listenTo() {
          return Entity
        },
        /**
         * Called after entity is loaded.
         */
        afterLoad(entity: any) { // TOOD this triggers too much
          // notifyFn(`AFTER ENTITY LOADED: `, entity)
        }

        /**
         * Called before post insertion.
         */,
        beforeInsert(event: InsertEvent<any>) {
          notifyFn(`BEFORE POST INSERTED: `, event.entity)
        }

        /**
         * Called after entity insertion.
         */,
        afterInsert(event: InsertEvent<any>) {
          notifyFn(`AFTER ENTITY INSERTED: `, event.entity)
        }

        /**
         * Called before entity update.
         */,
        beforeUpdate(event: UpdateEvent<any>) {
          notifyFn(`BEFORE ENTITY UPDATED: `, event.entity)
        }

        /**
         * Called after entity update.
         */,
        afterUpdate(event: UpdateEvent<any>) {
          notifyFn(`AFTER ENTITY UPDATED: `, event.entity)
        }

        /**
         * Called before entity removal.
         */,
        beforeRemove(event: RemoveEvent<any>) {
          notifyFn(
            `BEFORE ENTITY WITH ID ${event.entityId} REMOVED: `,
            event.entity,
          )
        }

        /**
         * Called after entity removal.
         */,
        afterRemove(event: RemoveEvent<any>) {
          notifyFn(
            `AFTER ENTITY WITH ID ${event.entityId} REMOVED: `,
            event.entity,
          )
        }

        /**
         * Called before entity removal.
         */,
        beforeSoftRemove(event: SoftRemoveEvent<any>) {
          notifyFn(
            `BEFORE ENTITY WITH ID ${event.entityId} SOFT REMOVED: `,
            event.entity,
          )
        }

        /**
         * Called after entity removal.
         */,
        afterSoftRemove(event: SoftRemoveEvent<any>) {
          notifyFn(
            `AFTER ENTITY WITH ID ${event.entityId} SOFT REMOVED: `,
            event.entity,
          )
        }

        /**
         * Called before entity recovery.
         */,
        beforeRecover(event: RecoverEvent<any>) {
          notifyFn(
            `BEFORE ENTITY WITH ID ${event.entityId} RECOVERED: `,
            event.entity,
          )
        }

        /**
         * Called after entity recovery.
         */,
        afterRecover(event: RecoverEvent<any>) {
          notifyFn(
            `AFTER ENTITY WITH ID ${event.entityId} RECOVERED: `,
            event.entity,
          )
        }

        /**
         * Called before transaction start.
         */,
        beforeTransactionStart(event: TransactionStartEvent) {
          notifyFn(`BEFORE TRANSACTION STARTED: `, event)
        }

        /**
         * Called after transaction start.
         */,
        afterTransactionStart(event: TransactionStartEvent) {
          notifyFn(`AFTER TRANSACTION STARTED: `, event)
        }

        /**
         * Called before transaction commit.
         */,
        beforeTransactionCommit(event: TransactionCommitEvent) {
          notifyFn(`BEFORE TRANSACTION COMMITTED: `, event)
        }

        /**
         * Called after transaction commit.
         */,
        afterTransactionCommit(event: TransactionCommitEvent) {
          notifyFn(`AFTER TRANSACTION COMMITTED: `, event)
        }

        /**
         * Called before transaction rollback.
         */,
        beforeTransactionRollback(event: TransactionRollbackEvent) {
          notifyFn(`BEFORE TRANSACTION ROLLBACK: `, event)
        }

        /**
         * Called after transaction rollback.
         */,
        afterTransactionRollback(event: TransactionRollbackEvent) {
          notifyFn(`AFTER TRANSACTION ROLLBACK: `, event)
        }
      };
      //#endregion

      // @ts-ignore
      this.context.connection.subscribers.push(sub);


    }
    //#endregion
  }



  async init() {


    // console.log(`

    // INIT

    // this.context.onlyForBackendRemoteServerAccess : ${this.context.onlyForBackendRemoteServerAccess}

    // `)
    if (this.context.onlyForBackendRemoteServerAccess) {
      // @ts-ignore
      this.app = {} as any;
    } else {

      //#region @backend
      // @ts-ignore
      this.app = express()
      this.initMidleware();
      const h = new http.Server(this.app);
      // @ts-ignore
      this.httpServer = h;

      if (!this.context.testMode) {
        h.listen(this.context.uri.port, () => {
          Helpers.log(`Server listening on port: ${this.context.uri.port}, hostname: ${this.context.uri.pathname},
              env: ${this.app.settings.env}
              `);
        });
      }
      //#endregion

      await this.initConnection();
      await this.initSubscribers();
      this.initDecoratorsFunctions();

      const { contexts } = (await import('./framework-context')).FrameworkContext;

      //#region @websql
      this.writeActiveRoutes(contexts);
      //#endregion

      //#region @backend
      this.context.publicAssets.forEach(asset => { // @ts-ignore
        this.app.use(asset.path, express.static(asset.location))
      });
      //#endregion

      // @ts-ignore
      this.realtime = new RealtimeNodejs(this.context);

      const instancesOfControllers: BASE_CONTROLLER<any>[] = this.context
        .allControllersInstances
        .filter(f => _.isFunction((f as any as BASE_CONTROLLER<any>).initExampleDbData)) as any;

      for (let index = 0; index < instancesOfControllers.length; index++) {
        const controllerInstance = instancesOfControllers[index]

        // preserve data but dont add any new
        await controllerInstance.initExampleDbData(this.context.workerMode);
      }


    }
  }

  private initDecoratorsFunctions() {
    this.context.initFunc.filter(e => {
      const currentCtrl = this.context.controllersClasses.find(ctrl => ctrl === e.target);
      if (currentCtrl) {
        e.initFN();

        ((controller: Function) => {

          const instance = this.context.getInstanceBy(controller);
          const config = CLASS.getConfig(currentCtrl);

          config.injections.forEach(inj => {
            Object.defineProperty(instance, inj.propertyName, { get: inj.getter as any });
          });
          // CLASS.setSing letonObj(controller, new (controller as any)());

          // Helpers.isBrowser && console.log(`[Firedev] Sing leton cleated for "${controller && controller.name}"`, CLASS.getSing leton(controller))
        })(currentCtrl);

      }
    });

  }

  public activeRoutes: { routePath: string; method: Models.Rest.HttpMethod }[] = []

  private writeActiveRoutes(contexts: FrameworkContext[], isWorker = false) {

    //#region @websql
    let routes = [];
    for (let index = 0; index < contexts.length; index++) {
      const context = contexts[index];

      const troutes = context.node.activeRoutes.map(({ method, routePath }) => {
        return `${MorphiHelpers.string(method.toUpperCase() + ':').fillUpTo(10)}${context.uri.href.replace(/\/$/, '')}${routePath}`
      });
      const tinstanceClass = _.first(context.controllersClasses) as any;
      // const tinstance = tinstanceClass && context.getInstance(tinstanceClass as any) as any as BASE_CONTROLLER<any>;
      const isWorker = context.workerMode;

      const fileNameFor = path.join(
        //#region @backend
        process.cwd(),
        //#endregion
        `tmp-routes--worker--`
        + `${path.basename(CLASS.getName(tinstanceClass)).replace(/\.js$/, '')}.json`);

      if (isWorker) {
        log.i(`FILE: ${fileNameFor}`)
        log.i(JSON.stringify(routes, null, 4))
        //#region @backend
        fse.writeJSONSync(fileNameFor, routes, {
          spaces: 2,
          encoding: 'utf8'
        })
        //#endregion
      } else { // @ts-ignore
        routes = [
          ...routes,
          ...(['', `---------- FOR HOST ${context.uri.href} ----------`]),
          ...troutes,
        ];
      }
    }
    const fileName = path.join(
      //#region @backend
      process.cwd(),
      //#endregion
      `tmp-routes.json`
    )

    log.d(`FILE: ${fileName}`)
    log.d(JSON.stringify(routes, null, 4))
    //#region @backend
    fse.writeJSONSync(fileName, routes, {
      spaces: 2,
      encoding: 'utf8'
    });
    //#endregion
    //#endregion
  }

  private initMidleware() {
    //#region @backend
    const app = this.app;
    if (this.context.middlewares) {
      this.context.middlewares.forEach(m => {
        const [fun, args] = m;
        app.use(fun.apply(null, args));
      });
    }

    app.use(fileUpload())
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(cookieParser());

    if (this.context.session) {

      const { frontendHost, maxAge } = this.context.session;

      const sessionObj = {
        frontendHost,
        secret: "mysecretsessioncookithing",
        saveUninitialized: true,
        cookie: { maxAge, secure: frontendHost.startsWith('https://') },
        resave: false,
      } as ISession;

      app.use(cors({
        credentials: true,
        origin: this.context.session.frontendHost,
      }));
      app.use(expressSession(sessionObj));
    } else {
      // console.log('NOT ENABLING SESSION')
      app.use(cors())
    }



    (() => {

      app.use((req, res, next) => {

        //#region good for cors session obj
        // if (this.context.session) {
        //   res.header('Access-Control-Allow-Origin', this.context.session.frontendHost);
        //   res.header('Access-Control-Allow-Credentials', 'true');
        //   res.header(
        //     'Access-Control-Allow-Headers',
        //     'Origin, X-Requested-With, Content-Type, Accept'
        //   );
        //   res.header("Access-Control-Allow-Methods", "PUT,POST,GET,HEAD,DELETE,OPTIONS,PATCH");
        // // maybe this
        // res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
        // }
        //#endregion

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
    //#endregion
  }

}
