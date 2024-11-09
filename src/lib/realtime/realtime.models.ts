import { EndpointContext } from '../endpoint-context';
import type { RealtimeCore } from './realtime-core';

export namespace RealtimeModels {
  export type SubsManagerOpt = {
    core: RealtimeCore;
    customEvent: string;
    roomName: string;
    property: string;
  };

  export type ChangeOption = {
    property?: string;
    customEvent?: string;
  };

  export type EventHandler = (...args: any[]) => void;
}
