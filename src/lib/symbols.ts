import { _ } from 'tnp-core/src';

/**
 * for backendSocket.in(ROOM_NAME).emit(EVENT)
 *
 * Room names are uniqe..
 * here I am limiting number of event for clients.
 */
class Realtime {
  NAMESPACE(contextName: string) {
    return `${contextName}-taonRealtimeNsp`;
  }

  TABLE_CHANGE(contextName: string, tableName: string) {
    return `${contextName}:listentablename${tableName}`;
  }

  readonly KEYroomSubscribe = `roomSubscribe`;

  readonly KEYroomUnsubscribe = `roomUnsubscribe`;

  // /**
  //  * TODO use it or not?
  //  * @deprecated
  //  */
  // ROOM_NAME_SUBSCRIBER_EVENT(
  //   contextName: string,
  //   className: string,
  //   propertyName: string,
  // ) {
  //   return `${contextName}:room${_.camelCase(className)}${propertyName}`.toLowerCase();
  // }

  //#region custom events in rooms
  ROOM_NAME_CUSTOM(contextName: string, customEvent: string) {
    return `${contextName}:CustomRoomEvent${customEvent}`;
  }

  ROOM_SUBSCRIBE_CUSTOM(contextName: string) {
    return `${contextName}:${this.KEYroomSubscribe}CustomRoomEvent`;
  }

  ROOM_UNSUBSCRIBE_CUSTOM(contextName: string) {
    return `${contextName}:${this.KEYroomUnsubscribe}CustomRoomEvent`;
  }
  //#endregion

  //#region entity events
  ROOM_NAME_UPDATE_ENTITY(
    contextName: string,
    className: string,
    entityId: number | string,
  ) {
    return `${contextName}:room${_.camelCase(className)}${entityId}`.toLowerCase();
  }

  ROOM_SUBSCRIBE_ENTITY_UPDATE_EVENTS(contextName: string) {
    return `${contextName}:${this.KEYroomSubscribe}EntityEvents`;
  }

  ROOM_UNSUBSCRIBE_ENTITY_UPDATE_EVENTS(contextName: string) {
    return `${contextName}:${this.KEYroomUnsubscribe}EntityEvents`;
  }
  //#endregion

  //#region entity property events
  ROOM_NAME_UPDATE_ENTITY_PROPERTY(
    contextName: string,
    className: string,
    property: string,
    entityId: number | string,
  ) {
    return `${contextName}:room${_.camelCase(className)}${_.camelCase(property)}${entityId}`.toLowerCase();
  }

  ROOM_SUBSCRIBE_ENTITY_PROPERTY_UPDATE_EVENTS(contextName: string) {
    return `${contextName}:${this.KEYroomSubscribe}EntityPropertyEvents`;
  }

  ROOM_UNSUBSCRIBE_ENTITY_PROPERTY_UPDATE_EVENTS(contextName: string) {
    return `${contextName}:${this.KEYroomUnsubscribe}EntityPropertyEvents`;
  }
  //#endregion
}

export namespace Symbols {
  export const ctxInClassOrClassObj = Symbol();

  export const taonInstanceId: string = `$$taoninstanceid$$`;

  export const fullClassNameStaticProperty: string = `$$fullclassName$$`;

  export const orignalClassClonesObj: string = `$$originalClassClonesObj$$`;
  export const classMethodsNames: string = `$$classMethodsNames$$`;

  export const REALTIME = new Realtime();

  export namespace metadata {
    export const className = `class:realname`;

    export namespace options {
      export const controller = `controller:options`;
      export const entity = `entity:options`;
      export const repository = `repository:options`;
      export const provider = `provider:options`;
      export const subscriber = `subscriber:options`;
      export const migration = `migration:options`;
    }
  }

  export namespace old {
    export const HAS_TABLE_IN_DB = Symbol();
    export const MDC_KEY = `modeldataconfig`;
    export const WEBSQL_REST_PROGRESS_FUN = Symbol();
    export const WEBSQL_REST_PROGRESS_FUN_START = Symbol();
    export const WEBSQL_REST_PROGRESS_FUN_DONE = Symbol();
    export const WEBSQL_REST_PROGRESS_TIMEOUT = Symbol();

    export const X_TOTAL_COUNT = `x-total-count`;
    export const CIRCURAL_OBJECTS_MAP_BODY_PARAM = `circuralmapbody`;
    export const CIRCURAL_OBJECTS_MAP_QUERY_PARAM = `circuralmapquery`;
    export const MAPPING_CONFIG_HEADER = `mappingheader`;
    export const MAPPING_CONFIG_HEADER_BODY_PARAMS = `mhbodyparams`;
    export const MAPPING_CONFIG_HEADER_QUERY_PARAMS = `mhqueryparams`;
    export const ENDPOINT_META_CONFIG = `ng2_rest_endpoint_config`;
    export const CLASS_DECORATOR_CONTEXT = `$$ng2_rest_class_context`;
    export const SOCKET_MSG = `socketmessageng2rest`;
    export const ERROR_MESSAGES_CLASS_NAME_MATCH = `Please check if your "class name" matches  @Controller( className ) or @Entity( className )`;
  }
}
