//#region imports
import { Helpers, _ } from 'tnp-core/src';
import { EndpointContext } from '../endpoint-context';
import { Symbols } from '../symbols';
import { ClassHelpers } from '../helpers/class-helpers';
import type { BaseRepository } from './base-repository';
import { BaseClass } from './base-class';
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
  async _() {
    const reposToInit = this.__repositories_to_init__;
    for (const repo of reposToInit) {
      await repo.__init(this);
    }
  }
  //#endregion

  //#region context
  /**
   * Current endpoint context
   */
  get __endpoint_context__() {
    return this[Symbols.ctxInClassOrClassObj] as EndpointContext;
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
    this.__repositories_to_init__.push(repoProxy as any);
    return repoProxy as any;
  }
  //#endregion

  //#region inject / custom repository
  injectCustomRepository<T>(
    cutomRepositoryClass: new (...args: any[]) => T,
  ): T {
    const repoProxy = this.__inject<T>(cutomRepositoryClass, {
      localInstance: true,
      locaInstanceConstructorArgs: [
        () => cutomRepositoryClass.prototype.entityClassResolveFn(),
      ],
    });
    this.__repositories_to_init__.push(repoProxy as any);
    return repoProxy;
  }
  //#endregion

  //#region inject / custom repo
  /**
   * aliast to .injectRepository()
   */
  injectCustomRepo<T>(cutomRepositoryClass: new (...args: any[]) => T): T {
    const repoProxy = this.injectCustomRepository<T>(cutomRepositoryClass);
    this.__repositories_to_init__.push(repoProxy as any);
    return repoProxy;
  }
  //#endregion

  //#region inject / controller
  injectController<T>(ctor: new (...args: any[]) => T): T {
    return this.__inject<T>(ctor, { localInstance: false });
  }
  //#endregion


  //#region inject / ctrl
  /**
   * aliast to .injectController()
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

  /**
   * Repositories to init (by controller)
   */
  protected __repositories_to_init__ = [] as BaseRepository<any>[];

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
      resolveClassFromContext?: string;
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
