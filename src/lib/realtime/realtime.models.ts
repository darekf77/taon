import { EndpointContext } from '../endpoint-context';
import type { RealtimeCore } from './realtime-core';

export namespace RealtimeModels {
  export type SubsManagerOpt = {
    core: RealtimeCore;
    customEvent: string;
    roomName: string;
    property: string;
  };

  export interface ChangeOption {
    /**
     * Specify property name to listen changes on that property only;
     */
    property?: string;
    /**
     * Override custom event name to listen
     */
    customEvent?: string;
    /**
     * Value from entity object.
     * Key for this value is usually id or unique key
     * property defined in entity decorator.
     * TODO @LAST IMPLEMENT unique key support
     */
    idOrUniqValue?: any;
  }

  export type EventHandler = (...args: any[]) => void;
}
