//#region imports
import { Helpers, _ } from 'tnp-core/src';

import { EndpointContext } from '../endpoint-context';
import { ClassHelpers } from '../helpers/class-helpers';
import { Symbols } from '../symbols';

import { BaseClass } from './base-class';
import { BaseCustomRepository } from './base-custom-repository';
import type { BaseRepository } from './base-repository';
//#endregion

export class BaseInjector<CloneT extends BaseClass = any> {
  /**
   * for proxy purposes
   */
  getOriginalPrototype: () => any;
  /**
   * for proxy purposes
   */
  getOriginalConstructor: () => any;

  //#region class initialization hook
  /**
   * class initialization hook
   * taon after class instace creation
   */
  async _() {}
  //#endregion

  //#region context
  /**
   * @deprecated use ctx instead
   * Current endpoint context
   */
  get __endpoint_context__() {
    return this[Symbols.ctxInClassOrClassObj] as EndpointContext;
  }

  /**
   * get  current endpoint context
   */
  get ctx() {
    return this.__endpoint_context__;
  }
  //#endregion

  //#region inject

  //#region inject / repo for entity
  /**
   * inject crud repo for entity
   */
  injectRepo<T>(entityForCrud: new (...args: any[]) => T): BaseRepository<T> {
    const repoProxy = this.__inject(void 0, {
      localInstance: true,
      resolveClassFromContext: 'BaseRepository',
      locaInstanceConstructorArgs: [() => entityForCrud],
    });
    return repoProxy as any;
  }
  //#endregion

  //#region inject / custom repository
  injectCustomRepository<T extends BaseCustomRepository>(
    cutomRepositoryClass: new (...args: any[]) => T,
  ): T {
    const repoProxy = this.__inject<T>(cutomRepositoryClass, {
      localInstance: true,
      locaInstanceConstructorArgs: [
        () => {
          const classToProcess =
            this.ctx.allClassesInstances[
              ClassHelpers.getName(cutomRepositoryClass)
            ];

          return classToProcess.entityClassResolveFn();
        },
      ],
    });
    return repoProxy;
  }
  //#endregion

  //#region inject / custom repo
  /**
   * aliast to this.injectRepository()
   */
  injectCustomRepo<T extends BaseCustomRepository>(
    cutomRepositoryClass: new (...args: any[]) => T,
  ): T {
    const repoProxy = this.injectCustomRepository<T>(cutomRepositoryClass);
    return repoProxy;
  }
  //#endregion

  //#region inject / controller
  /**
   * example usage:
   * ...
   * exampleController = this.injectController(ExampleController);
   * ...
   */
  injectController<T>(ctor: new (...args: any[]) => T): T {
    return this.__inject<T>(ctor, { localInstance: false });
  }
  //#endregion

  //#region inject / ctrl
  /**
   * example usage:
   * ...
   * exampleSubscriber = this.injectSubscriber(ExampleSubscriber)
   * ...
   */
  injectSubscriber<T>(ctor: new (...args: any[]) => T): T {
    return this.__inject<T>(ctor, { localInstance: false });
  }
  //#endregion

  //#region inject / ctrl
  /**
   * aliast to .injectController()
   */
  injectCtrl<T>(ctor: new (...args: any[]) => T): T {
    return this.injectController<T>(ctor);
  }
  //#endregion

  //#region inject / global provider
  /**
   * global provider available in every context
   */
  injectGlobalProvider<T>(ctor: new (...args: any[]) => T): T {
    return this.__inject<T>(ctor, { localInstance: false });
  }
  //#endregion

  //#region inject / context provider
  /**
   * context scoped provider
   * TODO
   */
  injectContextProvider<T>(ctor: new (...args: any[]) => T): T {
    return this.__inject<T>(ctor, { localInstance: false });
  }
  //#endregion

  //#region inject / __ inject
  /**
   * Inject: Controllers, Providers, Repositories, Services, etc.
   * TODO  addd nest js injecting
   */
  private __inject<T>(
    ctor: new (...args: any[]) => T,
    options?: {
      /**
       * (repositories are ONLY/ALWAYS local instances)
       * If true, then local instance will be created
       * controllers, providers can be local or global
       */
      localInstance: boolean;
      /**
       * Name of class that should be resolved from context
       * (in case ctor === undefined)
       */
      resolveClassFromContext?: string;
      /**
       * Args passed to constructor of BaseRepository
       * (for now just first arg is relevant)
       */
      locaInstanceConstructorArgs?: ConstructorParameters<typeof ctor>;
    },
  ): T {
    if (!options) {
      options = {} as any;
    }

    const contextClassInstance = this;
    return new Proxy(
      {},
      {
        get: (__, propName) => {
          const contextFromClass: EndpointContext =
            ctor && ctor[Symbols.ctxInClassOrClassObj];

          const resultContext: EndpointContext = contextFromClass
            ? contextFromClass
            : this.__endpoint_context__;

          if (options.resolveClassFromContext) {
            const resolvedClass = resultContext.getClassFunByClassName(
              options.resolveClassFromContext,
            );
            ctor = resolvedClass as any;
          }

          if (resultContext) {
            var instance: T = resultContext.inject(ctor, {
              ...options,
              contextClassInstance,
              parentInstanceThatWillGetInjectedStuff: this,
            });
            if (!instance) {
              throw new Error(
                `Not able to inject "${
                  ClassHelpers.getName(ctor) || ctor.name
                }" inside ` +
                  `property "${propName?.toString()}" on  class "${ClassHelpers.getName(
                    this,
                  )}".

              Please add "${
                ClassHelpers.getName(ctor) || ctor.name
              }" to (entites or contorllers or providers or repositories)

              `,
              );
            }

            const result =
              typeof instance[propName] === 'function'
                ? instance[propName].bind(instance)
                : instance[propName];

            // console.log(`Accessing injected "${propName?.toString()}" from "${ClassHelpers.getName(ctor) || ctor.name}"`,result)
            return result;
          }
          //#region @browser
          // return inject(ctor)[propName];
          //#endregion
        },
        set: (__, propName, value) => {
          const contextFromClass = ctor && ctor[Symbols.ctxInClassOrClassObj];
          const resultContext: EndpointContext = contextFromClass
            ? contextFromClass
            : this.__endpoint_context__;

          if (options.resolveClassFromContext) {
            const resolvedClass = resultContext.getClassFunByClassName(
              options.resolveClassFromContext,
            );
            ctor = resolvedClass as any;
          }

          if (resultContext) {
            var instance: T = resultContext.inject(ctor, {
              ...options,
              contextClassInstance,
              parentInstanceThatWillGetInjectedStuff: this,
            });
            if (!instance) {
              const classNameNotResolved =
                ClassHelpers.getName(ctor) || ctor.name;
              throw new Error(
                `Not able to inject "${classNameNotResolved}" inside ` +
                  `property "${propName?.toString()}" on  class "${ClassHelpers.getName(
                    this,
                  )}".

              Please add "${
                ClassHelpers.getName(ctor) || ctor.name
              }" to (entites or contorllers or providers or repositories)

              `,
              );
            }
            instance[propName] = value;
          }
          return true;
        },
      },
    ) as T;
  }
  //#endregion

  //#endregion

  //#region clone
  public clone(override: Partial<CloneT>): CloneT {
    const classFn = ClassHelpers.getClassFnFromObject(this);
    const result = _.merge(new classFn(), _.merge(_.cloneDeep(this), override));
    // console.log({result})
    return result;
  }
  //#endregion
}
