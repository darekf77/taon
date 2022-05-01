import { _, Helpers } from 'tnp-core';
import { MorphiHelpers } from '../helpers';
import { StartOptions, FrameworkMode } from './framework-models';
import { FrameworkContextBrowserApp } from './framework-context-browser-app';
import { CLASS } from 'typescript-class-helpers';
import { IConnectionOptions } from './framework-models';
import { FrameworkContextBase } from './framework-context-base';
//#region @backend
import { FrameworkContextNodeApp } from './framework-context-node-app.backend';
import { URL } from 'url';
//#endregion

export class FrameworkContext extends FrameworkContextBase {

  public static readonly initFunc: { initFN: Function, target: Function }[] = [];
  get initFunc() {
    return FrameworkContext.initFunc.filter(a => this.controllersClasses.includes(a.target));
  }


  // /**
  //  * @deprecated
  //  */
  // public static get Providers() {
  //   return _.sortedUniq(FrameworkContext.contexts.reduce((a, b) => {
  //     return a.concat(b.Providers);
  //   }, []))
  // }
  public readonly Providers: Function[] = [];

  private static readonly ngZoneInstance: any;
  public static initNGZone(ngZoneInstance: any) {
    // @ts-ignore
    FrameworkContext.ngZoneInstance = ngZoneInstance;
  }
  private static contextByClassName: { [className in string]: FrameworkContext; } = {};
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
        if (c === context) {
          delete FrameworkContext.contextByClassName[className];
        }
      });
  }

  destroy() {
    FrameworkContext.destroy(this);
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
      throw `[Firedev][findForTraget] incorrect target:
      shoould be string, function or object
      `
    }
    if (_.isFunction(target)) {
      className = CLASS.getName(target);
    } else if (_.isObject(target)) {
      className = CLASS.getNameFromObject(target);
    } else if (_.isString(target)) {
      className = target;
    }
    if (!className) {
      throw new Error(`[Firedev][findForTarget] incorrect class name: "${className}"`)
    }

    const result = FrameworkContext.contextByClassName[className];
    if (!result) {
      //#region @backend
      if (FrameworkContext.contexts.length === 1 &&
        _.first(FrameworkContext.contexts).mode === 'backend/frontend-worker') {
        return _.first(FrameworkContext.contexts);
      }
      //#endregion
      // console.log(`FrameworkContext.contexts.length: ${FrameworkContext.contexts.length}`)
      // console.trace('-' + className + '- context length: ' + FrameworkContext.contexts.length)
      throw new Error(`[Firedev][findForTarget] not able to find target by name: "${className}"`)
    }
    return result;
  }

  private static _isProductionModeAlreadySet = false;
  private static readonly _isProductionMode = false;
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

  public readonly uri: URL;
  private readonly context: StartOptions;
  public readonly allowedHosts: URL[] = [];
  public readonly disabledRealtime = false;
  public browser: FrameworkContextBrowserApp;
  //#region @backend
  public node: FrameworkContextNodeApp;
  //#endregion


  public get ngZone() {
    return FrameworkContext.ngZoneInstance;
  }

  public get host() {
    return this.context.host;
  }

  public get controllersClasses() {
    return [
      ...(this.context.controllers as any[]),
    ]
  }

  public get controllers() {
    let ctrls: Function[] = this.context.controllers as any;
    //#region @backend
    if (this.context.InitDataPriority) {
      ctrls = [
        ...(this.context.InitDataPriority ? this.context.InitDataPriority : []),
        ...(ctrls.filter(f => !(this.context.InitDataPriority as Function[]).includes(f)))
      ] as any;
    }
    //#endregion
    return ctrls.map(c => this.getInstance(c as any)).filter(f => !!f);
  }

  private instances = {};

  public getInstance(f: Function) {
    const className = CLASS.getName(f);
    if (!this.instances[className]) {
      this.instances[className] = new (f as any)();
    }
    return this.instances[className];
  }

  public get entitiesClasses() {
    return (this.context.entities as Function[]) || [];
  }

  //#region @backend
  public get mode() {
    return this.context.mode;
  }

  public get connection() {
    return this.node?.connection;
  }

  public get publicAssets() {
    return this.context.publicAssets || [];
  }

  public get InitDataPriority() {
    return this.context.InitDataPriority || [];
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
    //#region @backend
    validateConfigAndAssignEntites(context.config, this.mode, this.entitiesClasses);
    //#endregion
    this.prepareEntities();
  }

  anotherReason = `Please check if your "class name" matches  @Controller( className ) or @Entity( className )`;

  private prepareEntities() {
    //#region @backend
    if (this.context.config) {
      this.context.config['entities'] = this.entitiesClasses as any;
    };
    //#endregion
    this.entitiesClasses
      .forEach(c => {
        const className = CLASS.getName(c);
        if (FrameworkContext.contextByClassName[className]) {
          throw new Error(`[Firedev][frameworkcontext]
${this.anotherReason}

          Context already register for class "${className}"
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
${this.anotherReason}

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
    this.browser.init();
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
