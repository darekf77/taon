import * as _ from 'lodash';


export const SYMBOL = {
  HAS_TABLE_IN_DB: Symbol(),
  IS_ENPOINT_REALTIME: Symbol(),
  REALTIME: {
    NAMESPACE: 'morphirealtime',
    ROOM: {
      SUBSCRIBE_ENTITY_EVENTS: 'subscribeEntityEvents',
      UNSUBSCRIBE_ENTITY_EVENTS: 'unsubscribeEntityEvents'
    },
    EVENT: {
      ENTITY_UPDATE_BY_ID(className, entityId) {
        return `entityupdatebyid${_.camelCase(className)}${entityId}`.toLowerCase();
      }
    },
    ROOM_NAME(className, entityId) {
      return `room${_.camelCase(className)}${entityId}`.toLowerCase();
    }
  },
  X_TOTAL_COUNT: 'x-total-count',
  CRUD_TABLE_MODEL: 'model',
  CIRCURAL_OBJECTS_MAP_BODY: 'circuralmapbody',
  CIRCURAL_OBJECTS_MAP_QUERY_PARAM: 'circuralmapbody',
  MAPPING_CONFIG_HEADER: 'mappingheader',
  MAPPING_CONFIG_HEADER_BODY_PARAMS: 'mhbodyparams',
  MAPPING_CONFIG_HEADER_QUERY_PARAMS: 'mhqueryparams',
  ENDPOINT_META_CONFIG: 'ng2_rest_endpoint_config',
  METHOD_DECORATOR: '$$ng2_rest_method',
  CLASS_DECORATOR: '$$ng2_rest_class',
  CLASS_DECORATOR_CONTEXT: '$$ng2_rest_class_context',
  SOCKET_MSG: 'socketmessageng2rest'
}

