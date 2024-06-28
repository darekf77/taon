//#region imports
import { _ } from 'tnp-core/src';
import { RealtimeCore } from './realtime-core';
import { Symbols } from '../symbols';
import { Observable } from 'rxjs';
import { ClassHelpers } from '../helpers/class-helpers';
import { RealtimeSubsManager } from './realtime-subs-manager';
import { RealtimeModels } from './realtime.models';
import type { BaseEntity } from '../base-classes/base-entity';
import { Helpers } from 'tnp-core/src';
//#endregion

export class RealtimeClient {
  private subsmanagers: { [path: string]: RealtimeSubsManager } = {};
  constructor(private core: RealtimeCore) {
    this.core = core;
    if (!core.ctx.disabledRealtime) {
      //#region @browser
      this.init();
      //#endregion
    }
  }

  //#region methods & getters / init
  private init() {
    //#region prepare naspaces pathes
    const nspPath = {
      global: this.core.pathFor(),
      realtime: this.core.pathFor(
        Symbols.REALTIME.NAMESPACE(this.core.ctx.contextName),
      ),
    };

    this.core.ctx.logRealtime &&
      console.info(
        '[CLIENT] NAMESPACE GLOBAL ',
        nspPath.global.href + ` host: ${this.core.ctx.host}`,
      );

    this.core.ctx.logRealtime &&
      console.info(
        '[CLIENT] NAMESPACE REALTIME',
        nspPath.realtime.href + ` host: ${this.core.ctx.host}`,
      );
    //#endregion

    //#region prepare globa FE socket
    this.core.FE = this.core.strategy.io(nspPath.global.origin, {
      path: nspPath.global.pathname,
    });

    this.core.FE.on('connect', () => {
      // console.info(
      //   `[CLIENT] conented to GLOBAL namespace ${global.nsp} of host: ${context.host}`,
      // );
      console.info(
        `[CLIENT] conented to GLOBAL namespace ${this.core.FE.id} of host: ${this.core.ctx.host}`,
      );
    });
    //#endregion

    //#region prepare realtime FE socket
    this.core.FE_REALTIME = this.core.strategy.io(nspPath.realtime.origin, {
      path: nspPath.realtime.pathname,
    });

    this.core.FE_REALTIME.on('connect', () => {
      // console.info(
      //   `[CLIENT] conented to REALTIME namespace ${realtime.nsp} host: ${context.host}`,
      // );
      console.info(
        `[CLIENT] conented to REALTIME namespace ${this.core.FE_REALTIME.id} host: ${this.core.ctx.host}`,
      );
    });
    //#endregion


  }
  //#endregion

  //#region methods & getters  / listen changes entity
  /**
   * Changes trigger on backend needs to be done manually.. example code:
   *
   * ...
   * Context.Realtime.Server.TrigggerEntityChanges(myEntityInstance);
   * ...
   */
  listenChangesEntity(
    entityClassFn: Function,
    idOrUniqValue: any,
    options: RealtimeModels.ChangeOption,
  ) {
    options = options || ({} as any);

    //#region parameters validation
    const { property, customEvent } = options;
    const className = !customEvent && ClassHelpers.getName(entityClassFn);

    if (_.isString(property)) {
      if (property.trim() === '') {
        throw new Error(
          `[Firedev][listenChangesEntity.. incorect property '' for ${className}`,
        );
      }
    }
    //#endregion

    return new Observable(observer => {
      //#region prepare parameters for manager

      if (this.core.ctx.disabledRealtime) {
        console.error(`[Firedev][realtime rxjs] remove firedev config flag:

        ...
        disabledRealtime: true
        ...

to use socket realtime connection;
        `);
        return () => {
          // empty nothing to do
        };
      }

      let roomName: string;

      if (customEvent) {
        roomName = Symbols.REALTIME.ROOM_NAME.CUSTOM(
          this.core.ctx.contextName,
          customEvent,
        );
      } else {
        roomName = _.isString(property)
          ? Symbols.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(
              this.core.ctx.contextName,
              className,
              property,
              idOrUniqValue,
            )
          : Symbols.REALTIME.ROOM_NAME.UPDATE_ENTITY(
              this.core.ctx.contextName,
              className,
              idOrUniqValue,
            );
      }

      const roomSubOptions: RealtimeModels.SubsManagerOpt = {
        core: this.core,
        property,
        roomName,
        customEvent,
      };
      //#endregion

      const subManagerId = this.getRoomIdFrom(roomSubOptions);
      if (!this.subsmanagers[subManagerId]) {
        this.subsmanagers[subManagerId] = new RealtimeSubsManager(
          roomSubOptions,
        );
      }
      const inst = this.subsmanagers[subManagerId];
      inst.add(observer);

      inst.startListenIfNotStarted(this.core.FE_REALTIME);

      return () => {
        inst.remove(observer);
      };
    });
  }

  //#endregion

  //#region listen changes entity table
  listenChangesEntityTable(entityClassFn: Function) {
    const className = ClassHelpers.getName(entityClassFn);
    return this.listenChangesEntity(entityClassFn, void 0, {
      customEvent: Symbols.REALTIME.TABLE_CHANGE(
        this.core.ctx.contextName,
        className,
      ),
    });
  }

  //#endregion

  //#region listen change entity object
  /**
   * Changes trigger on backend needs to be done manually.. example code:
   *
   * ...
   * Context.Realtime.Server.TrigggerEntityChanges(myEntityInstance);
   * // or
   * Context.Realtime.Server.TrigggerEntityPropertyChanges(myEntityInstance,{ property: 'geolocationX' });
   * ...
   */
  listenChangesEntityObj<T extends BaseEntity>(
    entity: T,
    options?: RealtimeModels.ChangeOption,
  ) {
    const classFn = ClassHelpers.getClassFnFromObject(entity);
    const uniqueKey = ClassHelpers.getUniquKey(classFn);
    return this.listenChangesEntity(classFn, entity[uniqueKey], options);
  }
  //#endregion

  //#region listen changes custom event
  listenChangesCustomEvent(customEvent: string) {
    return this.listenChangesEntity(void 0, void 0, {
      customEvent,
    });
  }
  //#endregion

  //#region methods & getters / get room id from
  private getRoomIdFrom(options: RealtimeModels.SubsManagerOpt) {
    const url = new URL(options.core.ctx.host);
    return `${this.core.ctx.contextName}:${url.origin}|${options.roomName}|${options.property}|${options.customEvent}`;
  }
  //#endregion
}
