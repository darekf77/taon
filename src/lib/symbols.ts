import { _ } from 'tnp-core/src';
import { OrignalClassKey } from 'taon-typeorm/src';
import { SYMBOL } from 'typescript-class-helpers/src';

export namespace Symbols {
  export const ctxInClassOrClassObj = Symbol();
  export const classNameStaticProperty: string = SYMBOL.ClassNameStaticProperty;
  export const fullClassNameStaticProperty: string = `$$fullclassName$$`;
  export const orignalClass: string = OrignalClassKey;
  export const orignalClassClonesObj: string = `$$originalClassClonesObj$$`;
  export const classMethodsNames: string = `$$classMethodsNames$$`;

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

  export const REALTIME = new Realtime();

  export const metadata = {
    className: `class:realname`,
    options: {
      runtimeController: `runtime:controller:options`,
      controller: `controller:options`,
      controllerMethod: `controller:method:options`,
      entity: `entity:options`,
      repository: `repository:options`,
      provider: `provider:options`,
      subscriber: `subscriber:options`,
      migration: `migration:options`,
    },
  };

  export const old = {
    HAS_TABLE_IN_DB: Symbol(),
    MDC_KEY: `modeldataconfig`,
    WEBSQL_REST_PROGRESS_FUN: Symbol(),
    WEBSQL_REST_PROGRESS_FUN_START: Symbol(),
    WEBSQL_REST_PROGRESS_FUN_DONE: Symbol(),
    WEBSQL_REST_PROGRESS_TIMEOUT: Symbol(),

    X_TOTAL_COUNT: `x-total-count`,
    CIRCURAL_OBJECTS_MAP_BODY: `circuralmapbody`,
    CIRCURAL_OBJECTS_MAP_QUERY_PARAM: `circuralmapbody`,
    MAPPING_CONFIG_HEADER: `mappingheader`,
    MAPPING_CONFIG_HEADER_BODY_PARAMS: `mhbodyparams`,
    MAPPING_CONFIG_HEADER_QUERY_PARAMS: `mhqueryparams`,
    ENDPOINT_META_CONFIG: `ng2_rest_endpoint_config`,
    CLASS_DECORATOR_CONTEXT: `$$ng2_rest_class_context`,
    SOCKET_MSG: `socketmessageng2rest`,
    ANGULAR: {
      INPUT_NAMES: Symbol(),
    },
    ERROR_MESSAGES: {
      CLASS_NAME_MATCH: `Please check if your "class name" matches  @Controller( className ) or @Entity( className )`,
    },
  };
}
