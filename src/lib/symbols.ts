import { _ } from 'tnp-core/src';

export const SYMBOL = {
  HAS_TABLE_IN_DB: Symbol(),
  MDC_KEY: 'modeldataconfig',
  WEBSQL_REST_PROGRESS_FUN: Symbol(),
  WEBSQL_REST_PROGRESS_FUN_START: Symbol(),
  WEBSQL_REST_PROGRESS_FUN_DONE: Symbol(),
  WEBSQL_REST_PROGRESS_TIMEOUT: Symbol(),
  REALTIME: {
    NAMESPACE: 'firedevrealtime',
    TABLE_CHANGE(tableName: string) {
      return `listentablename${tableName}`;
    },
    /**
    * for backendSocket.in(ROOM_NAME).emit(EVENT)
    *
    * Room names are uniqe..
    * here I am limiting number of event for clients.
    */
    ROOM_NAME: { // it identifys group of client to notify
      CUSTOM(customEvent: string) {
        return `roomcustomevnet${customEvent}`;
      },
      UPDATE_ENTITY(className: string, entityId: number | string) {
        return `room${_.camelCase(className)}${entityId}`.toLowerCase();
      },
      UPDATE_ENTITY_PROPERTY(className: string, property: string, entityId: number | string) {
        return `room${_.camelCase(className)}${_.camelCase(property)}${entityId}`.toLowerCase();
      },

      SUBSCRIBE: {
        CUSTOM: 'roomSubscribeCustomRoomEvent',
        ENTITY_UPDATE_EVENTS: 'roomSubscribeEntityEvents',
        ENTITY_PROPERTY_UPDATE_EVENTS: 'roomSubscribeEntityPropertyEvents',
      },
      UNSUBSCRIBE: {
        CUSTOM: 'roomUnsubscribeCustomRoomEvent',
        ENTITY_UPDATE_EVENTS: 'roomUnsubscribeEntityEvents',
        ENTITY_PROPERTY_UPDATE_EVENTS: 'roomUnsubscribeEntityPropertyEvents',
      }
    }
  },
  X_TOTAL_COUNT: 'x-total-count',
  CRUD_TABLE_MODEL: 'model',
  CRUD_TABLE_MODELS: 'models',
  CIRCURAL_OBJECTS_MAP_BODY: 'circuralmapbody',
  CIRCURAL_OBJECTS_MAP_QUERY_PARAM: 'circuralmapbody',
  MAPPING_CONFIG_HEADER: 'mappingheader',
  MAPPING_CONFIG_HEADER_BODY_PARAMS: 'mhbodyparams',
  MAPPING_CONFIG_HEADER_QUERY_PARAMS: 'mhqueryparams',
  ENDPOINT_META_CONFIG: 'ng2_rest_endpoint_config',
  CLASS_DECORATOR_CONTEXT: '$$ng2_rest_class_context',
  SOCKET_MSG: 'socketmessageng2rest',
  ANGULAR: {
    INPUT_NAMES: Symbol()
  },
  ERROR_MESSAGES: {
    CLASS_NAME_MATCH: `Please check if your "class name" matches  @Controller( className ) or @Entity( className )`
  }
}
