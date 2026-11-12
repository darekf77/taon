//#region imports
import { _ } from 'tnp-core/src';

import { TaonBaseRepositoryClassName } from '../constants';
import { TaonContext } from '../create-context';
import { EndpointContext } from '../endpoint-context';
import { ClassHelpers } from '../helpers/class-helpers';
import { Symbols } from '../symbols';

import { TaonBaseAbstractEntity } from './base-abstract-entity';
import { TaonBaseCustomRepository } from './base-custom-repository';
import type { TaonBaseRepository } from './base-repository';
//#endregion

export class TaonBaseInjector {
  //#region proxy dummy function
  /**
   * for proxy purposes
   */
  getOriginalPrototype: () => any;

  /**
   * for proxy purposes
   */
  getOriginalConstructor: () => any;
  //#endregion

  //#region class initialization hook
  /**
   * class initialization hook
   * taon after class instace creation
   */
  async _(): Promise<void> {}
  //#endregion

  //#region context
  //#region @browser
  protected readonly currentContext: TaonContext;
  //#endregion

  /**
   * @deprecated use ctx instead
   * Current endpoint context
   */
  get __endpoint_context__(): EndpointContext {
    //#region @browser
    if (this.currentContext?.__refSync) {
      return this.currentContext?.__refSync;
    }
    //#endregion
    return this[Symbols.ctxInClassOrClassObj] as EndpointContext;
  }

  /**
   * get  current endpoint context
   */
  get ctx(): EndpointContext {
    return this.__endpoint_context__;
  }
  //#endregion

  //#region inject
  protected inject<T>(ctor: new (...args: any[]) => T): T {
    return this.__createProxy<T>(ctor, {});
  }
  //#endregion

  //#region inject / repo for entity
  /**
   * inject crud repo for entity
   */
  protected injectRepo<T extends TaonBaseAbstractEntity>(
    entityForCrud: new (...args: any[]) => T,
  ): TaonBaseRepository<T> {
    const repoProxy = this.__createProxy(entityForCrud, {
      resolveClassFromContext: TaonBaseRepositoryClassName,
    });
    return repoProxy as any;
  }
  //#endregion

  //#region get context for ctor
  private __getContextFor(ctor: any): EndpointContext {
    const contextFromClass: EndpointContext =
      ctor && ctor[Symbols.ctxInClassOrClassObj];

    const resultContext: EndpointContext = contextFromClass
      ? contextFromClass
      : this.__endpoint_context__;

    if (!resultContext) {
      throw new Error(
        `
      Context not available. Make sure to .initialize()
      the context before injecting Taon building blocks
      (controllers, providers, repositories etc.)

      `,
      );
    }
    return resultContext;
  }
  //#endregion

  //#region not instance error
  private __noInstanceError({
    instance,
    ctor,
    propName,
  }: {
    instance: any;
    ctor: any;
    propName: string | symbol;
  }): void {
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
        }" to (entites or contorllers or providers or repositories or middlewares)

        `,
      );
    }
  }
  //#endregion

  //#region create proxy
  /**
   * Inject: Controllers, Providers, Repositories, Services, etc.
   * TODO  addd nest js injecting
   */
  //#region methods / create proxy
  protected __createProxy<T>(
    ctor: new (...args: any[]) => T,
    options?: {
      /**
       * Name of class that should be resolved from context
       * instead ctor
       */
      resolveClassFromContext?: string;
    },
  ): T {
    options = options || ({} as any);

    return new Proxy(
      {},
      {
        get: (__, propName) => {
          const ctx = this.__getContextFor(ctor);

          const instance: T = ctx.getInstanceBy(ctor, {
            resolveClassFromContext: options.resolveClassFromContext,
          });
          this.__noInstanceError({ instance, ctor, propName });

          const result =
            typeof instance[propName] === 'function'
              ? instance[propName].bind(instance)
              : instance[propName];

          return result;
        },
        set: (__, propName, value) => {
          const ctx = this.__getContextFor(ctor);

          const instance: T = ctx.getInstanceBy(ctor, {
            resolveClassFromContext: options.resolveClassFromContext,
          });
          this.__noInstanceError({ instance, ctor, propName });
          instance[propName] = value;
          return true;
        },
      },
    ) as T;
  }
  //#endregion
  //#endregion
}
