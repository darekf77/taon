
import { SYMBOL as NG2RestSYMBOL } from 'ng2-rest';


export const SYMBOL = {
  FORMLY_METADATA_ARRAY: Symbol(),
  IS_ENPOINT_REALTIME: Symbol(),
  MODELS_MAPPING: NG2RestSYMBOL.MODELS_MAPPING,
  DEFAULT_MODEL: NG2RestSYMBOL.DEFAULT_MODEL,
  REALTIME: {
    NAMESPACE: 'morphirealtime',
    ROOM: {
      SUBSCRIBE_ENTITY_EVENTS: 'subscribeEntityEvents',
      UNSUBSCRIBE_ENTITY_EVENTS: 'unsubscribeEntityEvents'
    },
    EVENT: {
      ENTITY_UPDATE_BY_ID(className, entityId) {
        return `entityupdatebyid${className}${entityId}`;
      }
    },
    ROOM_NAME(className, entityId) {
      return `room${className}${entityId}`;
    }
  },
  X_TOTAL_COUNT: 'x-total-count',
  CRUD_TABLE_MODEL: 'model',
  MAPPING_CONFIG_HEADER: 'mappingheader',
  MAPPING_CONFIG_HEADER_BODY_PARAMS: 'mhbodyparams',
  MAPPING_CONFIG_HEADER_QUERY_PARAMS: 'mhqueryparams',
  ENDPOINT_META_CONFIG: 'ng2_rest_endpoint_config',
  METHOD_DECORATOR: '$$ng2_rest_method',
  CLASS_DECORATOR: '$$ng2_rest_class',
  CLASS_DECORATOR_CONTEXT: '$$ng2_rest_class_context',
  SOCKET_MSG: 'socketmessageng2rest'
}

