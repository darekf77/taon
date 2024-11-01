//#region imports
import { Symbols } from '../symbols';
import { Helpers, _ } from 'tnp-core/src';
import { RealtimeCore } from './realtime-core';
import { ClassHelpers } from '../helpers/class-helpers';
import type { BaseEntity } from '../base-classes/base-entity';
//#endregion

const SOCKET_EVENT_DEBOUNCE = 500;

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

  //#region methods & getters /  init
  private init() {
    //#region @websql

    if (!this.core.ctx.config.frontendHost) {
      console.warn(`[Taon][Realtime]

      Frontend host is not defined
      REALTIME COUMMUNICATION WILL NOT WORK

      provide "frontendHost" property in your taon config

      `);
    }

    //#region prepare namespaces pathes
    const nspPath = {
      global: this.core.pathFor(),
      realtime: this.core.pathFor(
        Symbols.REALTIME.NAMESPACE(this.core.ctx.contextName),
      ),
    };

    //#endregion

    // console.log('[backend] nspPath', nspPath);

    //#region prepare global BE socket
    this.core.connectSocketBE = new this.core.strategy.Server(
      Helpers.isWebSQL ? this.core.ctx.uri.origin : this.core.ctx.serverTcpUdp,
      {
        path: nspPath.global.pathname,

        cors: {
          origin: this.core.ctx.config.frontendHost,
          methods: this.core.allHttpMethods,
        },
      }, // @ts-ignore
      this.core.ctx,
    );

    this.core.ctx.logRealtime &&
      console.info(
        `[backend] CREATE GLOBAL NAMESPACE: '${this.core.connectSocketBE.path()}'` +
          ` , path: '${nspPath.global.pathname}'`,
      );

    this.core.connectSocketBE.on('connection', clientSocket => {
      if (Helpers.isElectron) {
        // @ts-ignore
        this.core.connectSocketBE.emit('connect'); // TODO QUICK_FIX
      }
      // console.info(
      //   `[backend] client conected to namespace "${clientSocket.nsp?.name}",  host: ${this.core.ctx.host}`,
      // );
    });

    //#endregion

    //#region prepare realtime BE socket
    this.core.socketBE = new this.core.strategy.Server(
      Helpers.isWebSQL ? this.core.ctx.uri.origin : this.core.ctx.serverTcpUdp,
      {
        path: nspPath.realtime.pathname,
        cors: {
          origin: this.core.ctx.config.frontendHost,
          methods: this.core.allHttpMethods,
        },
      }, // @ts-ignore
      this.core.ctx,
    );

    this.core.ctx.logRealtime &&
      console.info(
        `[backend] CREATE REALTIME NAMESPACE: '${this.core.socketBE.path()}'` +
          ` , path: '${nspPath.realtime.pathname}' `,
      );

    this.core.socketBE.on('connection', backendSocketForClient => {
      // console.info(
      //   `[backend] client conected to namespace "${backendSocketForClient.nsp?.name}",  host: ${this.core.ctx.host}`,
      // );

      if (Helpers.isElectron) {
        // @ts-ignore
        backendSocketForClient = this.core.socketBE; // TODO QUICK_FIX
        this.core.socketBE.emit('connect');
      }

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM(this.core.ctx.contextName),
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
        Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_UPDATE_EVENTS(
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
        Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS(
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
        Symbols.REALTIME.ROOM_NAME.UNSUBSCRIBE.CUSTOM(
          this.core.ctx.contextName,
        ),
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
        Symbols.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS(
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
        Symbols.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS(
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
    valueOfUniquPropery?: number | string,
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
      roomName = Symbols.REALTIME.ROOM_NAME.CUSTOM(
        this.core.ctx.contextName,
        customEvent,
      );
    } else {
      let entityFn = entityObjOrClass as Function;
      const enittyIsObject =
        !_.isFunction(entityObjOrClass) && _.isObject(entityObjOrClass);

      if (enittyIsObject) {
        entityFn = ClassHelpers.getClassFnFromObject(entityObjOrClass);
      }

      const uniqueKey = ClassHelpers.getUniquKey(entityFn);

      if (enittyIsObject) {
        valueOfUniquPropery = entityObjOrClass[uniqueKey];
      }

      if (!valueOfUniquPropery) {
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
        ? Symbols.REALTIME.ROOM_NAME.UPDATE_ENTITY_PROPERTY(
            this.core.ctx.contextName,
            ClassHelpers.getName(entityFn),
            property,
            valueOfUniquPropery,
          )
        : Symbols.REALTIME.ROOM_NAME.UPDATE_ENTITY(
            this.core.ctx.contextName,
            ClassHelpers.getName(entityFn),
            valueOfUniquPropery,
          );
    }

    // console.log(`Trigger realtime: ${this.core.ctx.contextName}/${roomName}`,eventData);
    this.core.socketBE.in(roomName).emit(
      roomName, // roomName == eventName in room na
      customEvent ? customEventData : '',
    );
    //#endregion
  }
  //#endregion

  //#region methods & getters / trigger entity changes
  public trigggerEntityChanges(
    entityObjOrClass: Function,
    idToTrigger?: number | string,
  ) {
    if (this.core.ctx.disabledRealtime) {
      const className = ClassHelpers.getName(entityObjOrClass);

      console.warn(
        `[Taon][TrigggerEntityChanges] Entity "${className}' is not realtime`,
      );
      return;
    }
    this.triggerChanges(entityObjOrClass as any, void 0, idToTrigger);
  }
  //#endregion

  //#region methods & getters / trigger entity property changes
  public trigggerEntityPropertyChanges<ENTITY extends BaseEntity>(
    entityObjOrClass: new (...args) => ENTITY,
    property: keyof ENTITY | (keyof ENTITY)[],
    idToTrigger?: number | string,
  ) {
    if (this.core.ctx.disabledRealtime) {
      const className = ClassHelpers.getName(entityObjOrClass);

      console.warn(
        `[Taon][TrigggerEntityPropertyChanges][property=${
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

  //#region methods & getters / trigger custom event
  public triggerCustomEvent(customEvent: string, dataToPush: any) {
    this.triggerChanges(void 0, void 0, void 0, customEvent, dataToPush);
  }
  //#endregion

  //#region methods & getters / trigger entity table changes
  public trigggerEntityTableChanges(entityClass: Function) {
    const className = ClassHelpers.getName(entityClass);
    if (this.core.ctx.disabledRealtime) {
      console.warn(
        `[Taon][TrigggerEntityTableChanges] Entity "${className}' is not realtime`,
      );
      return;
    }

    this.triggerChanges(
      entityClass as any,
      void 0,
      void 0,
      Symbols.REALTIME.TABLE_CHANGE(this.core.ctx.contextName, className),
    );
  }
  //#endregion
}
