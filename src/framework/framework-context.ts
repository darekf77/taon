import * as _ from 'lodash';
import { Helpers } from '../helpers';
import { StartOptions, FrameworkMode } from './framework-models';
import { FrameworkContextBrowserApp } from './framework-context-browser-app';
//#region @backend
import { FrameworkContextNodeApp } from './framework-context-node-app.backend';
import { IConnectionOptions } from './framework-models';
import { FrameworkContextBase } from './framework-context-base';
import { CLASS } from 'typescript-class-helpers';
if (Helpers.isNode) {
  var { URL } = require('url');
}
//#endregion


// example url:
// backend URI URL {
// href: 'http://localhost:4000/api',
// origin: 'http://localhost:4000',
// protocol: 'http:',
// username: '',
// password: '',
// host: 'localhost:4000',
// hostname: 'localhost',
// port: '4000',
// pathname: '/api',
// search: '',
// searchParams: URLSearchParams {},
// hash: ''

export class FrameworkContext extends FrameworkContextBase {
  public static readonly __core_controllers: Function[] = [];
  public static readonly initFunc: { initFN: Function, target: Function }[] = [];
  get initFunc() {
    return FrameworkContext.initFunc.filter(a => this.controllers.includes(a.target));
  }

  /**
   * @deprecated
   */
  public static get Providers() {
    return _.sortedUniq(FrameworkContext.contexts.reduce((a, b) => {
      return a.concat(b.Providers);
    }, []))
  }
  public readonly Providers: Function[] = [];
  public static readonly contexts: FrameworkContext[] = [];
  private static readonly ngZoneInstance: any;
  public static initNGZone(ngZoneInstance: any) {
    // @ts-ignore
    FrameworkContext.ngZoneInstance = ngZoneInstance;
  }

  private static contextByClassName: { [className in string]: FrameworkContext; } = {};

  /**
   * Get global context for target
   * @param target class name or class function or class object
   */
  public static findForTraget(target: Function | object | string): FrameworkContext {
    let className: string;
    if (_.isArray(target)) {
      throw `[morphi][findForTraget] incorrect target:
      shoould be string, function or object
      `
    }
    if (_.isFunction(target)) {
      className = CLASS.getName(target);
    }
    if (_.isObject(target)) {
      className = CLASS.getNameFromObject(target);
    }
    if (_.isString(target)) {
      className = target;
    }
    if (!className) {
      throw `[morphi][findForTarget] incorrect class name: "${className}"`
    }

    const result = FrameworkContext.contextByClassName[className];
    if (!result) {
      throw `[morphi][findForTarget] not able to find target by name: "${className}"`
    }
    return result;
  }

  private static _isProductionModeAlreadySet = false;
  private static readonly _isProductionMode = false;
  public static get isProductionMode() {
    return FrameworkContext._isProductionMode;
  }

  public set isProductionMode(v: boolean) {
    if (!FrameworkContext._isProductionModeAlreadySet) {
      FrameworkContext._isProductionModeAlreadySet = true;
    } else {
      throw `[Morphi] production mode already set`
    }
    // @ts-ignore
    FrameworkContext._isProductionMode = v;
  }

  public readonly uri: URL;
  private readonly context: StartOptions;
  public readonly allowedHosts: URL[] = [];
  public readonly disabledRealtime = false;
  public browser: FrameworkContextBrowserApp;
  //#region @backend
  public node: FrameworkContextNodeApp;



  //#endregion

  //#region getters
  public get ngZone() {
    return FrameworkContext.ngZoneInstance;
  }

  public get publicAssets() {
    return this.context.publicAssets || [];
  }

  public get InitDataPriority() {
    return this.context.InitDataPriority || [];
  }
  public get host() {
    return this.context.host;
  }

  public get controllers() {
    return FrameworkContext.__core_controllers
      .concat(this.context.controllers as any[]) as Function[];
  }

  public get controllersSingletons() {
    let ctrls: Function[] = this.context.controllers as any;

    if (this.context.InitDataPriority) {
      ctrls = [
        ...(this.context.InitDataPriority ? this.context.InitDataPriority : []),
        ...(ctrls.filter(f => !(this.context.InitDataPriority as Function[]).includes(f)))
      ] as any;
    }
    ctrls = ctrls.filter(ctrl => !['BASE_CONTROLLER', 'BaseCRUD'].includes(ctrl.name));

    return ctrls.map(c => Helpers.getSingleton(c as any)).filter(f => !!f);
  }

  public get entities() {
    return (this.context.entities as Function[]) || [];
  }

  public get mode() {
    return this.context.mode;
  }

  public get config() {
    return this.context.config;
  }

  get onlyForBackendRemoteServerAccess() {
    return this.context.mode === 'remote-backend';
  }

  get workerMode() {
    return this.context.mode === 'backend/frontend-worker';
  }

  get testMode() {
    return this.context.mode === 'tests';
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
    //#endregion @backend
    validateConfigAndAssignEntites(context.config, this.mode, this.entities);
    //#endregion
    this.prepareEntities();
  }

  prepareEntities() {
    this.context.config['entities'] = this.entities as any;
    this.entities
      .forEach(c => {
        const className = CLASS.getName(c);
        if (FrameworkContext.contextByClassName[className]) {
          throw `[morphi][frameworkcontext] Context already register for class "${className}"
This is class names based framework....
You can create subclass from this class to fix this

@Morphi.Entity({
  ...
  className: '${className}Extended'
  ...
})
class ${className}Extended extends ${className} {
  ...
}

          `;
        }
        FrameworkContext.contextByClassName[className] = this;
      });
  }
  prepareControllers() {
    this.context.controllers = _.sortedUniq(this.context.controllers as Function[]);
    this.context.controllers
      .forEach(c => {
        const className = CLASS.getName(c);
        if (FrameworkContext.contextByClassName[className]) {
          throw `[morphi][frameworkcontext] Context already register for class "${className}"
This is class names based framework....
You can create subclass from this class to fix this

@Morphi.Controller({
  ...
  className: '${className}Extended'
  ...
})
class ${className}Extended extends ${className} {
  ...
}

          `;
        }
        FrameworkContext.contextByClassName[className] = this;
      });
  }

  public async initNode() {
    //#region @backend
    if (Helpers.isNode) {
      this.node = new FrameworkContextNodeApp(this);
      await this.node.init();
    }
    //#endregion
  }

  public initBrowser() {
    if (Helpers.isBrowser && _.isUndefined(this.ngZone) && !!window['ng']) {
      console.warn(`Please probide ngZone instance in angular apps`)
    }


    this.browser = new FrameworkContextBrowserApp(this);
  }

  initRealtime() {
    if (this.context.disabledRealtime) {
      return;
    }
    //#region @backend
    this.node.initRealtime();
    //#region
    this.browser.initRealtime();
  }
  private initUrl() {
    // @ts-ignore
    this.uri = new URL(this.host);
  }



  private checkContextIfExists() {
    if (FrameworkContext.contexts.includes(this)) {
      console.error(`[framework-context] Context already exists`)
    }
  }

}


//#region @backend
function validateConfigAndAssignEntites(
  config: IConnectionOptions,
  mode: FrameworkMode,
  entities: Function[]) {

  if (!config) {
    config = {} as any;

    if (mode === 'backend/frontend') {
      console.error(`

      Missing config for backend:


      Morphi.init({
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

Incorect value for property "controllers" inside Morphi.Init(...)

`
  }

  if (_.isArray(entities) && entities.filter(f => !_.isFunction(f)).length > 0) {
    console.error('entites', entities)
    throw `

Incorect value for property "entities" inside Morphi.Init(...)

`
  }
}
