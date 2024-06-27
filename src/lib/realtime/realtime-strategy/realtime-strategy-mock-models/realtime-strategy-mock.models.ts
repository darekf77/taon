import { MockNamespace } from "./realtime-strategy-mock-namespaces";
import { MockSocket } from "./realtime-strategy-mock-socket";

export interface EventListeners {
  [event: string]: Array<(data?: any) => void>;
}

export interface Rooms {
  [room: string]: Set<MockSocket>;
}

export interface Namespaces {
  [namespace: string]: MockNamespace;
}
