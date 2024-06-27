//#region imports
import { Symbols } from '../symbols';
import { Helpers, _ } from 'tnp-core/src';
import { RealtimeCore } from './realtime-core';
import { ClassHelpers } from '../helpers/class-helpers';
import type { BaseEntity } from '../base-classes/base-entity';
//#endregion

const SOCKET_EVENT_DEBOUNCE = 500;

export class RealtimeServer {
  private jobs = {};
  constructor(private core: RealtimeCore) {
    this.core = core;
    if (!core.ctx.disabledRealtime) {
      this.init();
    }
  }

  //#region methods & getters /  init
  private init() {
    //#region @websql

    // if (Helpers.isElectron) {
    //   return;
    // }

    const nspPath = {
      global: this.core.pathFor(),
      realtime: this.core.pathFor(
        Symbols.REALTIME.NAMESPACE(this.core.ctx.contextName),
      ),
    };

    this.core.BE = new this.core.strategy.Server(this.core.ctx.serverTcpUdp, {
      path: nspPath.global.pathname,

      cors: {
        origin: this.core.ctx.config.frontendHost,
        methods: this.core.allHttpMethods,
      },
      // href: nspPath.global.href,
    });

    // const ioGlobalNsp = base.BE;

    this.core.BE.on('connection', clientSocket => {
      console.info(
        `client conected to namespace "${clientSocket.nsp.name}",  host: ${this.core.ctx.host}`,
      );
    });

    console.info(
      `CREATE GLOBAL NAMESPACE: '${this.core.BE.path()}' , path: '${
        nspPath.global.pathname
      }'`,
    );

    this.core.BE_REALTIME = new this.core.strategy.Server(
      this.core.ctx.serverTcpUdp,
      {
        path: nspPath.realtime.pathname,
        cors: {
          origin: this.core.ctx.config.frontendHost,
          methods: this.core.allHttpMethods,
        },
        //#region @browser
        // href: nspPath.realtime.href,
        //#endregion
      },
    );

    console.info(
      `CREATE REALTIME NAMESPACE: '${this.core.BE_REALTIME.path()}' , path: '${
        nspPath.realtime.pathname
      }' `,
    );

    // base.BE_REALTIME = ioRealtimeNsp as any;

    this.core.BE_REALTIME.on('connection', backendSocketForClient => {
      console.info(
        `client conected to namespace "${backendSocketForClient.nsp.name}",  host: ${this.core.ctx.host}`,
      );

      backendSocketForClient.on(
        Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM(this.core.ctx.contextName),
        roomName => {
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
          console.info(
            `Joining room ${roomName} in namespace  REALTIME` +
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
          console.info(
            `Joining room ${roomName} in namespace REALTIME ` +
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
          console.info(
            `Leaving room ${roomName} in namespace  REALTIME` +
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
          console.info(
            `Leaving room ${roomName} in namespace REALTIME ` +
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
          console.info(
            `Leaving room ${roomName} in namespace REALTIME ` +
              ` host: ${this.core.ctx.contextName}/${this.core.ctx.host}`,
          );
          backendSocketForClient.leave(roomName);
        },
      );
    });

    //#endregion
  }
  //#endregion

  //#region methods & getters / trigger changes
  private triggerChanges(
    entityObjOrClass: Function,
    property?: string,
    valueOfUniquPropery?: number | string,
    customEvent?: string,
    customEventData?: any,
  ) {
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
          `[Firedev][Realtime] Entity without iD ! ${ClassHelpers.getName(
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

    const job = () => {
      console.log(`Trigger realtime: ${this.core.ctx.contextName}/${roomName}`);
      this.core.BE_REALTIME.in(roomName).emit(
        roomName, // roomName == eventName in room na
        customEventData ? customEventData : '',
      );
    };

    if (!_.isFunction(this.jobs[roomName])) {
      this.jobs[roomName] = _.debounce(() => {
        job();
      }, SOCKET_EVENT_DEBOUNCE);
    }

    this.jobs[roomName]();
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
        `[Firedev][TrigggerEntityChanges] Entity "${className}' is not realtime`,
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
        `[Firedev][TrigggerEntityPropertyChanges][property=${
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
        `[Firedev][TrigggerEntityTableChanges] Entity "${className}' is not realtime`,
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
