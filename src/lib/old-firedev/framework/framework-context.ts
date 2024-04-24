//#region imports
import { _, Helpers } from 'tnp-core/src';
import { StartOptions, FrameworkMode, MiddlewareType } from './framework-models';
import { FrameworkContextBrowserApp } from './framework-context-browser-app';
import { CLASS } from 'typescript-class-helpers/src';
import { IConnectionOptions } from './framework-models';
import { FrameworkContextBase } from './framework-context-base';
//#region @websql
import { FrameworkContextNodeApp } from './framework-context-node-app';
//#region @backend
import { URL } from 'url';
//#endregion
//#endregion
import type { BASE_CONTROLLER } from './framework-controller';
import { BaseCRUD } from '../crud';
import { SYMBOL } from '../symbols';
//#endregion

export class FrameworkContext extends FrameworkContextBase {

  //#region static
  public static readonly initFunc: { initFN: Function, target: Function }[] = [];
  private static readonly ngZoneInstance: any;
  private static _isProductionModeAlreadySet = false;
  private static readonly _isProductionMode = false;

  public static get isNgZoneInited() {
    return !!FrameworkContext.ngZoneInstance;
  }
  public static initNGZone(ngZoneInstance: any) {
    if (ngZoneInstance) {
      // @ts-ignore
      FrameworkContext.ngZoneInstance = ngZoneInstance;
    }
  }
  private static contextByClassName: { [className in string]: FrameworkContext; } = {};

  public static get isProductionMode() {
    return FrameworkContext._isProductionMode;
  }

  public static set isProductionMode(v: boolean) {
    if (!FrameworkContext._isProductionModeAlreadySet) {
      FrameworkContext._isProductionModeAlreadySet = true;
    } else {
      throw `[Firedev] production mode already set`
    }
    // @ts-ignore
    FrameworkContext._isProductionMode = v;
  }


  public static get contexts(): FrameworkContext[] {

    const res = _.sortedUniq(Object
      .keys(FrameworkContext.contextByClassName)
      .map(className => FrameworkContext.contextByClassName[className]));

    return res;
  }

  static destroy(context: FrameworkContext) {
    Object
      .keys(FrameworkContext.contextByClassName)
      .forEach(className => {
        const c = FrameworkContext.contextByClassName[className];
        if (c.host === context.host) {
          delete FrameworkContext.contextByClassName[className];
        }
      });
  }

  public static findByHost(host: string) {
    const uri = new URL(host);
    return FrameworkContext.contexts.find(c => c.uri.host === uri.host);
  }

  /**
   * Get global context for target
   * @param target class name or class function or class object
   */
  public static findForTraget(target: Function | object | string): FrameworkContext {
    let className: string;
    if (_.isArray(target)) {
      throw new Error(`[Firedev][findForTraget] incorrect target:
      shoould be string, function or object
      `)
    }
    if (_.isFunction(target)) {
      className = CLASS.getName(target);
    } else if (_.isObject(target)) {
      className = CLASS.getNameFromObject(target);
    } else if (_.isString(target)) {
      className = target;
    }
    if (!className) {
      if (Helpers.isBrowser) {
        throw new Error(`[Firedev][findForTarget] incorrect/missing class name: "${className}"`)
      } else {
        //#region @backend
        Helpers.error(`[Firedev][findForTarget] incorrect/missing class name: "${className}"`, false, false)
        //#endregion
      }

    }

    const result = FrameworkContext.contextByClassName[className];
    if (!result) {
      //#region @websql
      if (FrameworkContext.contexts.length === 1 &&
        _.first(FrameworkContext.contexts).mode === 'backend-worker') {
        return _.first(FrameworkContext.contexts);
      }
      //#endregion
      // console.log(`FrameworkContext.contexts.length: ${FrameworkContext.contexts.length}`)
      // console.trace('-' + className + '- context length: ' + FrameworkContext.contexts.length)
      if (Helpers.isBrowser) {
        throw new Error(`[Firedev][findForTarget] not able to find target by name: "${className}"`)
      } else {
        //#region @backend
        Helpers.error(`[Firedev][findForTarget] incorrect/missing class name: "${className}"`, false, false)
        //#endregion
      }

    }
    return result;
  }


  //#endregion

  //#region fields
  public readonly Providers: Function[] = [];

  public readonly uri: URL;
  private readonly context: StartOptions;
  public readonly allowedHosts: URL[] = [];
  public readonly disabledRealtime = false;
  public browser: FrameworkContextBrowserApp;
  //#region @websql
  public node: FrameworkContextNodeApp;
  //#endregion

  //#endregion

  //#region methods & getters
  get initFunc() {
    return FrameworkContext.initFunc.filter(a => this.controllersClasses.includes(a.target));
  }

  destroy() {
    FrameworkContext.destroy(this);
  }




  public get ngZone() {
    return FrameworkContext.ngZoneInstance;
  }

  public get host() {
    return this.context.host;
  }

  public get middlewares(): MiddlewareType[] {
    //#region @backendFunc
    return this.context.middlewares || [];
    //#endregion
  }

  public get session() {
    //#region @backendFunc
    return this.context.session;
    //#endregion
  }

  public get controllersClasses() {
    return [
      ...(this.context.controllers as any[]),
    ]
  }

  public get allControllersInstances(): (object)[] {
    let ctrls: Function[] = this.context.controllers as any;
    //#region @websql
    if (this.context.InitDataPriority) {
      ctrls = [
        ...(this.context.InitDataPriority ? this.context.InitDataPriority : []),
        ...(ctrls.filter(f => !(this.context.InitDataPriority as Function[]).includes(f)))
      ] as any;
    }
    //#endregion
    return ctrls.map(c => this.getInstanceBy(c as any)).filter(f => !!f);
  }

  public get crudControllersInstances(): BASE_CONTROLLER<any>[] {
    return this.allControllersInstances.filter(c => {
      return c instanceof BaseCRUD;
    }).map(c => {
      return c as BASE_CONTROLLER<any>;
    });
  }

  private instances = {};

  /**
   * Get controller instace by name of class function
   */
  public getInstanceBy(ctrlClassOrName: Function | string) {
    if (!ctrlClassOrName) {
      return;
    }
    const className = _.isString(ctrlClassOrName) ? ctrlClassOrName : CLASS.getName(ctrlClassOrName);
    if (!this.instances[className]) {
      this.instances[className] = new (ctrlClassOrName as any)();
    }
    return this.instances[className] as (object | BASE_CONTROLLER<any>)
  }

  public get entitiesClasses() {
    return (this.context.entities as Function[]) || [];
  }

  //#region @websql
  public get mode() {
    return this.context.mode;
  }

  public get connection(): any {
    return this.node?.connection;
  }

  public get publicAssets() {
    return this.context.publicAssets || [];
  }

  public get InitDataPriority() {
    return this.context.InitDataPriority || [];
  }

  public get config() {
    return this.context.config as IConnectionOptions;
  }

  get onlyForBackendRemoteServerAccess() {
    return this.context.mode === 'remote-backend';
  }

  get workerMode() {
    return this.context.mode === 'backend-worker';
  }

  get testMode() {
    return this.context.mode === 'tests';
  }

  get websqlBackendOnFrontend() {
    return this.context.mode === 'websql/backend-frontend';
  }
  //#endregion

  constructor(context: StartOptions) {
    super();
    this.context = context;
    this.initUrl();
    this.checkContextIfExists();
    validateClassFunctions(context.controllers, context.entities);
    this.prepareControllers();

    if (_.isArray(context.allowedHosts)) {
      context.allowedHosts.forEach(h => this.allowedHosts.push(new URL(h)));
    }
    if (_.isBoolean(context.disabledRealtime) && context.disabledRealtime) {
      // @ts-ignore
      this.disabledRealtime = true;
    }
    if (Helpers.isElectron) {
      // @ts-ignore
      this.disabledRealtime = true;
    }
    //#region @websql
    validateConfigAndAssignEntites(context.config as any, this.mode, this.entitiesClasses);
    //#endregion
    this.prepareEntities();
  }


  private prepareEntities() {
    //#region @websql
    if (this.context.config) {
      this.context.config['entities'] = this.entitiesClasses as any;
    };
    //#endregion
    this.entitiesClasses
      .forEach(c => {
        const className = CLASS.getName(c);
        if (FrameworkContext.contextByClassName[className]) {
          throw new Error(`[Firedev][frameworkcontext]
${SYMBOL.ERROR_MESSAGES.CLASS_NAME_MATCH}

          Context already register for class "${className}"
This is class names based framework....
You can create subclass from this class to fix this

@Firedev.Entity({
  ...
  className: '${className}Extended'
  ...
})
class ${className}Extended extends ${className} {
  ...
}

          `);
        }
        FrameworkContext.contextByClassName[className] = this;
      });
  }
  private prepareControllers() {
    // console.log('PREPRARE CONTROLLERS !!!')
    this.context.controllers = _.sortedUniq(this.context.controllers as Function[]);
    this.context.controllers
      .forEach(c => {
        const className = CLASS.getName(c);
        if (FrameworkContext.contextByClassName[className]) {
          throw new Error(`[Firedev][frameworkcontext]
${SYMBOL.ERROR_MESSAGES.CLASS_NAME_MATCH}

          Context already register for class "${className}"
This is class names based framework....
You can create subclass from this class to fix this

@Firedev.Controller({
  ...
  className: '${className}Extended'
  ...
})
class ${className}Extended extends ${className} {
  ...
}

          `);
        }
        FrameworkContext.contextByClassName[className] = this;
      });
  }

  private initAllControllersInstances() {
    for (const c of this.context.controllers) {
      // @ts-ignore
      this.getInstanceBy(c);
    }
  }

  public async initNode() {
    //#region @websql
    this.node = new FrameworkContextNodeApp(this);
    await this.node.init();
    this.initAllControllersInstances();
    //#endregion
  }

  public initBrowser() {
    if (Helpers.isBrowser && _.isUndefined(this.ngZone) && !!window['ng']) {
      console.warn(`Please probide ngZone instance in angular apps`)
    }


    this.browser = new FrameworkContextBrowserApp(this);
    this.browser.init();
    this.initAllControllersInstances();
  }

  private initUrl() {
    // @ts-ignore
    this.uri = new URL(this.host);
  }



  private checkContextIfExists() {
    if (FrameworkContext.contexts.includes(this)) {
      throw `[framework-context] Context already exists`;
    }
    if (FrameworkContext.contexts.find(c => c.host === this.host)) {
      throw `[framework-context] Context with host ${this.host} already exists`;
    }
  }

  //#endregion

}


//#region @websql
function validateConfigAndAssignEntites(
  config: IConnectionOptions,
  mode: FrameworkMode,
  entities: Function[]) {

  if (!config) {
    config = {} as any;

    if (mode === 'backend/frontend') {
      console.error(`

      Missing config for backend:


      Firedev.init({
        ...
        config: <YOUR DB CONFIG HERE>
        ...
      })

    `);
    }
  }
}
//#endregion

function validateClassFunctions(controllers, entities) {

  if (_.isArray(controllers) && controllers.filter(f => !_.isFunction(f)).length > 0) {
    console.error('controllers', controllers)
    throw `

Incorect value for property "controllers" inside Firedev.Init(...)

`
  }

  if (_.isArray(entities) && entities.filter(f => !_.isFunction(f)).length > 0) {
    console.error('entites', entities)
    throw `

Incorect value for property "entities" inside Firedev.Init(...)

`
  }


}
