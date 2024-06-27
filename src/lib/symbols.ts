import { _ } from 'tnp-core/src';
import { OrignalClassKey } from 'firedev-typeorm/src';
import { SYMBOL } from 'typescript-class-helpers/src';

export namespace Symbols {
  export const ctxInClassOrClassObj = Symbol();
  export const classNameStaticProperty: string = SYMBOL.ClassNameStaticProperty;
  export const fullClassNameStaticProperty: string = `$$fullclassName$$`;
  export const orignalClass: string = OrignalClassKey;
  export const orignalClassClonesObj: string = `$$originalClassClonesObj$$`;
  export const classMethodsNames: string = `$$classMethodsNames$$`;

  export const REALTIME = {
    NAMESPACE: (contextName: string) => `${contextName}:firedevRealtimeNsp`,
    TABLE_CHANGE(contextName: string, tableName: string) {
      return `${contextName}:listentablename${tableName}`;
    },
    /**
     * for backendSocket.in(ROOM_NAME).emit(EVENT)
     *
     * Room names are uniqe..
     * here I am limiting number of event for clients.
     */
    ROOM_NAME: {
      // it identifys group of client to notify
      CUSTOM(contextName: string, customEvent: string) {
        return `${contextName}:roomcustomevnet${customEvent}`;
      },
      UPDATE_ENTITY(
        contextName: string,
        className: string,
        entityId: number | string,
      ) {
        return `${contextName}:room${_.camelCase(className)}${entityId}`.toLowerCase();
      },
      UPDATE_ENTITY_PROPERTY(
        contextName: string,
        className: string,
        property: string,
        entityId: number | string,
      ) {
        return `${contextName}:room${_.camelCase(className)}${_.camelCase(property)}${entityId}`.toLowerCase();
      },

      SUBSCRIBE: {
        CUSTOM: (contextName:string) => `${contextName}:roomSubscribeCustomRoomEvent`,
        ENTITY_UPDATE_EVENTS:(contextName:string) => `${contextName}:roomSubscribeEntityEvents`,
        ENTITY_PROPERTY_UPDATE_EVENTS:(contextName:string) => `${contextName}:roomSubscribeEntityPropertyEvents`,
      },
      UNSUBSCRIBE: {
        CUSTOM:(contextName:string) => `${contextName}:roomUnsubscribeCustomRoomEvent`,
        ENTITY_UPDATE_EVENTS:(contextName:string) => `${contextName}:roomUnsubscribeEntityEvents`,
        ENTITY_PROPERTY_UPDATE_EVENTS:(contextName:string) => `${contextName}:roomUnsubscribeEntityPropertyEvents`,
      },
    },
  };

  export const metadata = {
    className: `class:realname`,
    options: {
      runtimeController: `runtime:controller:options`,
      controller: `controller:options`,
      controllerMethod: `controller:method:options`,
      entity: `entity:options`,
      repository: `repository:options`,
      provider: `provider:options`,
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
