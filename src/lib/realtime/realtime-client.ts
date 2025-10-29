//#region imports
import { Observable } from 'rxjs';
import { _, UtilsOs } from 'tnp-core/src';
import { Helpers } from 'tnp-core/src';

import type { BaseEntity } from '../base-classes/base-entity';
import { ClassHelpers } from '../helpers/class-helpers';
import { Symbols } from '../symbols';

import { RealtimeCore } from './realtime-core';
import { RealtimeSubsManager } from './realtime-subs-manager';
import { RealtimeModels } from './realtime.models';

//#endregion

export class RealtimeClient {
  private subsManagers: { [path: string]: RealtimeSubsManager } = {};
  constructor(private core: RealtimeCore) {
    this.core = core;
    if (!core.ctx.disabledRealtime) {
      // this.core.ctx.logRealtime &&
      //   Helpers.info(`

      //   [ctx=${this.core.ctx.contextName}] init RealtimeClient (type: ${this.core.ctx.contextType})

      //   `);
      this.init();
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
    // console.log('[browser] nspPath', nspPath);

    if (
      this.core.ctx.config.frontendHost &&
      this.core.ctx.config.frontendHost !== '' &&
      this.core.ctx.isRunningInsideDocker
    ) {
      this.core.ctx.logRealtime &&
        Helpers.logInfo(
          `[${this.core.ctx.contextName}] USING FRONTEND HOST` +
            ` ${this.core.ctx.config.frontendHost} FOR REALTIME`,
        );
      nspPath.global = new URL(
        `${this.core.ctx.frontendHostUri.origin}${nspPath.global.pathname}`,
      );
      nspPath.realtime = new URL(
        `${this.core.ctx.frontendHostUri.origin}${nspPath.realtime.pathname}`,
      );
    } else {
      this.core.ctx.logRealtime &&
        Helpers.logInfo(
          `[${this.core.ctx.contextName}] Not using frontend host for realtime`,
        );
    }

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
    this.core.conectSocketFE = this.core.strategy.ioClient(
      nspPath.global.origin,
      {
        path: nspPath.global.pathname,
      },
    );

    if (this.core.conectSocketFE.on) {
      this.core.conectSocketFE.on('connect', () => {
        // console.info(
        //   `[CLIENT] connected to GLOBAL namespace ${global.nsp} of host: ${context.host}`,
        // );
        this.core.ctx.logRealtime &&
          console.info(
            `[CLIENT] connected to GLOBAL namespace ${nspPath.global.pathname}` +
              ` of host: ${this.core.ctx.host}`,
          );
      });
    }

    //#endregion

    //#region prepare realtime FE socket
    this.core.socketFE = this.core.strategy.ioClient(nspPath.realtime.origin, {
      path: nspPath.realtime.pathname,
    });

    if (this.core.socketFE.on) {
      this.core.socketFE.on('connect', () => {
        // console.info(
        //   `[CLIENT] connected to REALTIME namespace ${realtime.nsp} host: ${context.host}`,
        // );
        this.core.ctx.logRealtime &&
          console.info(
            `[CLIENT] connected to REALTIME namespace ${nspPath.realtime.pathname}` +
              ` host: ${this.core.ctx.host}`,
          );
      });
    }

    //#endregion
  }
  //#endregion

  //#region methods & getters  / listen changes entity
  /**
   * Usage:
   * myContext.realtimeClient.listenChangesEntity(myEntityInstance);
   *
   *
   * Changes trigger on backend needs to be done manually.. example code:
   *
   * myContext.realtimeServer.triggerEntityChanges(myEntityInstance);
   * ...
   */
  listenChangesEntity<RESULT = any>(
    entityClassFnOrObj: Function | object,
    idOrUniqValue?: any,
    options?: RealtimeModels.ChangeOption,
  ): Observable<RESULT> {
    options = options || ({} as any);

    if (_.isObject(entityClassFnOrObj)) {
      const classFn = ClassHelpers.getClassFnFromObject(entityClassFnOrObj);
      const uniqueKey = ClassHelpers.getUniqueKey(classFn);
      idOrUniqValue = uniqueKey;
    }

    //#region parameters validation
    const { property, customEvent } = options;
    const className = !customEvent && ClassHelpers.getName(entityClassFnOrObj);

    if (_.isString(property)) {
      if (property.trim() === '') {
        throw new Error(
          `[Taon][listenChangesEntity.. incorrect property '' for ${className}`,
        );
      }
    }
    //#endregion

    return new Observable(observer => {
      //#region prepare parameters for manager

      if (this.core.ctx.disabledRealtime) {
        console.error(`[Taon][realtime rxjs] remove taon config flag:

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
        roomName = Symbols.REALTIME.ROOM_NAME_CUSTOM(
          this.core.ctx.contextName,
          customEvent,
        );
      } else {
        roomName = _.isString(property)
          ? Symbols.REALTIME.ROOM_NAME_UPDATE_ENTITY_PROPERTY(
              this.core.ctx.contextName,
              className,
              property,
              idOrUniqValue,
            )
          : Symbols.REALTIME.ROOM_NAME_UPDATE_ENTITY(
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

      const subManagerId =
        this.getUniqueIdentifierForConnection(roomSubOptions);
      if (!this.subsManagers[subManagerId]) {
        this.subsManagers[subManagerId] = new RealtimeSubsManager(
          roomSubOptions,
        );
      }
      const inst = this.subsManagers[subManagerId];
      inst.add(observer);

      inst.startListenIfNotStarted(this.core.socketFE);

      return () => {
        inst.remove(observer);
      };
    });
  }

  //#endregion

  //#region listen changes entity table
  /**
   * Listen changes entity table
   * Example: for pagination, lists update ...
   */
  listenChangesEntityTable<RESULT = any>(
    entityClassFn: Function,
  ): Observable<RESULT> {
    const className = ClassHelpers.getName(entityClassFn);
    return this.listenChangesEntity<RESULT>(entityClassFn, void 0, {
      customEvent: Symbols.REALTIME.TABLE_CHANGE(
        this.core.ctx.contextName,
        className,
      ),
    });
  }
  //#endregion

  //#region listen changes custom event
  listenChangesCustomEvent<RESULT = any>(
    customEvent: string,
  ): Observable<RESULT> {
    return this.listenChangesEntity<RESULT>(void 0, void 0, {
      customEvent,
    });
  }
  //#endregion

  //#region methods & getters / trigger custom event\
  /**
   * Trigger custom event on backend
   * @param customEvent global event name
   * @param dataToPush
   */
  public triggerCustomEvent(customEvent: string, dataToPush?: any): void {
    this.core.socketFE.emit(customEvent, dataToPush);
  }
  //#endregion

  //#region methods & getters / get room id from
  private getUniqueIdentifierForConnection(
    options: RealtimeModels.SubsManagerOpt,
  ): string {
    let url: URL = new URL(options.core.ctx.host);
    let contextNameForCommunication =
      options.core.ctx.contextNameForCommunication;
    return `${contextNameForCommunication}:${url.origin}|${options.roomName}|${options.property}|${options.customEvent}`;
  }
  //#endregion
}
