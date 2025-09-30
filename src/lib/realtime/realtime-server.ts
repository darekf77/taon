//#region imports
import { URL } from 'url'; // @backend

import { Observable, Subject } from 'rxjs';
import { Helpers, _ } from 'tnp-core/src';

import type { BaseEntity } from '../base-classes/base-entity';
import { ClassHelpers } from '../helpers/class-helpers';
import { Symbols } from '../symbols';

import { RealtimeCore } from './realtime-core';

//#endregion

export class RealtimeServer {
  // private jobs = {};
  constructor(private core: RealtimeCore) {
    this.core = core;
    if (!core.ctx.disabledRealtime) {
      //#region @websql
      this.init();
      //#endregion
    }
  }

  //#region methods & getters / init
  private init() {
    //#region @browser
    if (!this.core.ctx.config.frontendHost) {
      console.warn(`[Taon][Realtime]

      Frontend host is not defined
      REALTIME COMMUNICATION WILL NOT WORK

      provide "frontendHost" property in your taon config

      `);
    }
    //#endregion

    //#region @websql

    //#region prepare namespaces pathes
    const nspPathGlobal = this.core.pathFor();
    const nspPathRealtime = this.core.pathFor(
      Symbols.REALTIME.NAMESPACE(this.core.ctx.contextName),
    );

    //#endregion

    // console.log('[backend] nspPath', nspPath);

    const cors = {
      origin: this.core.ctx.frontendHostUri.origin, // only origin needs to be set - pathname not needed
      methods: this.core.allHttpMethods,
    };

    // console.log('frontendHost', this.core.ctx.config.frontendHost);
    // console.log('cors', cors);

    //#region prepare global BE socket
    this.core.connectSocketBE = this.core.strategy.ioServer(
      Helpers.isWebSQL ? this.core.ctx.uriOrigin : this.core.ctx.serverTcpUdp,
      {
        path: nspPathGlobal.pathname,
        cors,
      }, // @ts-ignore
      this.core.ctx,
    );

    this.core.ctx.logRealtime &&
      console.info(
        `[backend] CREATE GLOBAL NAMESPACE: '${this.core.connectSocketBE.path()}'` +
          ` , path: '${nspPathGlobal.pathname}'`,
      );

    this.core.connectSocketBE.on('connection', clientSocket => {
      console.info(
        `[backend] client connected to namespace "${nspPathGlobal.pathname}", ` +
          ` host: ${this.core.ctx.host}`,
      );
    });

    //#endregion

    //#region prepare realtime BE socket
    this.core.socketBE = this.core.strategy.ioServer(
      Helpers.isWebSQL || Helpers.isElectron
        ? this.core.ctx.uriOrigin
        : this.core.ctx.serverTcpUdp,
      {
        path: nspPathRealtime.pathname,
        cors,
      }, // @ts-ignore
      this.core.ctx,
    );

    this.core.ctx.logRealtime &&
      console.info(
        `[backend] CREATE REALTIME NAMESPACE: '${this.core.socketBE.path()}'` +
          ` , path: '${nspPathRealtime.pathname}' `,
      );

    this.core.socketBE.on('connection', backendSocketForClient => {
      console.info(
        `[backend] client connected to namespace "${nspPathRealtime.pathname}", ` +
          ` host: ${this.core.ctx.host}`,
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_SUBSCRIBE_CUSTOM(this.core.ctx.contextName),
        roomName => {
          this.core.ctx.logRealtime &&
            console.info(
              `Joining room ${roomName} in namespace  REALTIME` +
                ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
            );
          backendSocketForClient.join(roomName);
        },
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_SUBSCRIBE_ENTITY_UPDATE_EVENTS(
          this.core.ctx.contextName,
        ),
        roomName => {
          this.core.ctx.logRealtime &&
            console.info(
              `[backend] Joining room ${roomName} in namespace  REALTIME` +
                ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
            );
          backendSocketForClient.join(roomName);
        },
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_SUBSCRIBE_ENTITY_PROPERTY_UPDATE_EVENTS(
          this.core.ctx.contextName,
        ),
        roomName => {
          this.core.ctx.logRealtime &&
            console.info(
              `[backend] Joining room ${roomName} in namespace REALTIME ` +
                ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
            );
          backendSocketForClient.join(roomName);
        },
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_UNSUBSCRIBE_CUSTOM(this.core.ctx.contextName),
        roomName => {
          this.core.ctx.logRealtime &&
            console.info(
              `[backend] Leaving room ${roomName} in namespace  REALTIME` +
                ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
            );
          backendSocketForClient.leave(roomName);
        },
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_UNSUBSCRIBE_ENTITY_UPDATE_EVENTS(
          this.core.ctx.contextName,
        ),
        roomName => {
          this.core.ctx.logRealtime &&
            console.info(
              `[backend] Leaving room ${roomName} in namespace REALTIME ` +
                ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
            );
          backendSocketForClient.leave(roomName);
        },
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_UNSUBSCRIBE_ENTITY_PROPERTY_UPDATE_EVENTS(
          this.core.ctx.contextName,
        ),
        roomName => {
          this.core.ctx.logRealtime &&
            console.info(
              `[backend] Leaving room ${roomName} in namespace REALTIME ` +
                ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
            );
          backendSocketForClient.leave(roomName);
        },
      );
    });

    //#endregion

    //#endregion
  }
  //#endregion

  //#region methods & getters / trigger changes
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private triggerChanges(
    entityObjOrClass: Function,
    property?: string,
    valueOfUniqueProperty?: number | string,
    customEvent?: string,
    customEventData?: any,
  ) {
    // console.log('customEventData', customEventData);
    // console.info('__triger entity changes');
    //#region @websql

    let roomName: string;

    if (this.core.ctx.disabledRealtime) {
      return;
    }

    if (customEvent) {
      roomName = Symbols.REALTIME.ROOM_NAME_CUSTOM(
        this.core.ctx.contextName,
        customEvent,
      );
    } else {
      let entityFn = entityObjOrClass as Function;
      const entityIsObject =
        !_.isFunction(entityObjOrClass) && _.isObject(entityObjOrClass);

      if (entityIsObject) {
        entityFn = ClassHelpers.getClassFnFromObject(entityObjOrClass);
      }

      const uniqueKey = ClassHelpers.getUniqueKey(entityFn);

      if (entityIsObject) {
        valueOfUniqueProperty = entityObjOrClass[uniqueKey];
      }

      if (!valueOfUniqueProperty) {
        Helpers.error(
          `[Taon][Realtime] Entity without iD ! ${ClassHelpers.getName(
            entityFn,
          )} `,
          true,
          true,
        );
        return;
      }

      roomName = _.isString(property)
        ? Symbols.REALTIME.ROOM_NAME_UPDATE_ENTITY_PROPERTY(
            this.core.ctx.contextName,
            ClassHelpers.getName(entityFn),
            property,
            valueOfUniqueProperty,
          )
        : Symbols.REALTIME.ROOM_NAME_UPDATE_ENTITY(
            this.core.ctx.contextName,
            ClassHelpers.getName(entityFn),
            valueOfUniqueProperty,
          );
    }

    this.core.socketBE.in(roomName).emit(
      roomName, // roomName == eventName in room na
      customEvent ? customEventData : '',
    );
    //#endregion
  }
  //#endregion

  //#region entity changes

  //#region methods & getters / trigger entity changes
  public triggerEntityChanges(
    entityObjOrClass: Function,
    idToTrigger?: number | string,
  ) {
    if (this.core.ctx.disabledRealtime) {
      const className = ClassHelpers.getName(entityObjOrClass);

      console.warn(
        `[Taon][TriggerEntityChanges] Entity "${className}' is not realtime`,
      );
      return;
    }
    this.triggerChanges(entityObjOrClass as any, void 0, idToTrigger);
  }
  //#endregion

  //#region methods & getters / trigger entity property changes
  public triggerEntityPropertyChanges<ENTITY extends BaseEntity>(
    entityObjOrClass: new (...args) => ENTITY,
    property: keyof ENTITY | (keyof ENTITY)[],
    idToTrigger?: number | string,
  ) {
    if (this.core.ctx.disabledRealtime) {
      const className = ClassHelpers.getName(entityObjOrClass);

      console.warn(
        `[Taon][TriggerEntityPropertyChanges][property=${
          property as string
        }] Entity "${className}' is not realtime`,
      );
      return;
    }

    if (_.isArray(property)) {
      property.forEach(propertyFromArr => {
        this.triggerChanges(
          entityObjOrClass,
          propertyFromArr as any,
          idToTrigger,
        );
      });
    } else {
      this.triggerChanges(entityObjOrClass, property as any, idToTrigger);
    }
  }
  //#endregion

  //#region methods & getters / trigger entity table changes
  public triggerEntityTableChanges(entityClassOrInstance: Function | object) {
    const className = ClassHelpers.getName(entityClassOrInstance);

    if (this.core.ctx.disabledRealtime) {
      console.warn(
        `[Taon][TriggerEntityTableChanges] Entity "${className}' is not realtime`,
      );
      return;
    }

    this.triggerChanges(
      entityClassOrInstance as any,
      void 0,
      void 0,
      Symbols.REALTIME.TABLE_CHANGE(this.core.ctx.contextName, className),
    );
  }
  //#endregion

  //#endregion

  //#region custom changes

  //#region methods & getters / trigger custom event
  public triggerCustomEvent(customEvent: string, dataToPush: any) {
    this.triggerChanges(void 0, void 0, void 0, customEvent, dataToPush);
  }
  //#endregion

  //#region methods & getters / listen custom events from users
  /**
   * Listen to custom events from users
   * @param customEvent  global event name
   */
  listenChangesCustomEvent(customEvent: string): Observable<any> {
    //#region @websqlFunc
    const sub = new Subject<any>();

    this.core.socketBE.on('connection', backendSocketForClient => {
      backendSocketForClient.on(customEvent, (data, ...args) => {
        sub.next(data);
      });
    });

    return sub.asObservable();
    //#endregion
  }
  //#endregion

  //#endregion
}
