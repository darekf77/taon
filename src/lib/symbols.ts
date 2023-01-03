import { _ } from 'tnp-core';

export const SYMBOL = {
  HAS_TABLE_IN_DB: Symbol(),
  MDC_KEY: 'modeldataconfig',
  REALTIME: {
    NAMESPACE: 'firedevrealtime',
    ROOM: {
      SUBSCRIBE: {
        CUSTOM: 'subscribeCustomRoomEvent',
        ENTITY_UPDATE_EVENTS: 'subscribeEntityEvents',
        ENTITY_PROPERTY_UPDATE_EVENTS: 'subscribeEntityPropertyEvents',
      },
      UNSUBSCRIBE: {
        CUSTOM: 'unsubscribeCustomRoomEvent',
        ENTITY_UPDATE_EVENTS: 'unsubscribeEntityEvents',
        ENTITY_PROPERTY_UPDATE_EVENTS: 'unsubscribeEntityPropertyEvents',
      }
    },
    EVENT: {
      CUSTOM(customEvent: string) {
        return `customevnet${customEvent}`;
      },
      ENTITY_UPDATE_BY_ID(className: string, entityId: number | string) {
        return `entityupdatebyid${_.camelCase(className)}${entityId}`.toLowerCase();
      },
      ENTITY_PROPTERY_UPDATE_BY_ID(className: string, property: string, entityId: number | string) {
        return `entityupdatebyid${_.camelCase(className)}${_.camelCase(property)}${entityId}`.toLowerCase();
      },
    },
    ROOM_NAME: {
      CUSTOM(customEvent: string) {
        return `roomcustomevnet${customEvent}`;
      },
      UPDATE_ENTITY(className: string, entityId: number | string) {
        return `room${_.camelCase(className)}${entityId}`.toLowerCase();
      },
      UPDATE_ENTITY_PROPERTY(className: string, property: string, entityId: number | string) {
        return `room${_.camelCase(className)}${_.camelCase(property)}${entityId}`.toLowerCase();
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
  ERROR_MESSAGES : {
    CLASS_NAME_MATCH: `Please check if your "class name" matches  @Controller( className ) or @Entity( className )`
  }
}
