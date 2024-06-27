import { MockNamespace } from "./realtime-strategy-mock-namespaces";
import { EventListeners } from "./realtime-strategy-mock.models";


export class MockSocket {
  private listeners: EventListeners = {};

  constructor(public id: string, private namespace: MockNamespace) {
    this.namespace.addSocket(this);
  }

  on(event: string, callback: (data?: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback?: (data?: any) => void) {
    if (!this.listeners[event]) return;

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(listener => listener !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }

  join(room: string) {
    this.namespace.joinRoom(this, room);
  }

  leave(room: string) {
    this.namespace.leaveRoom(this, room);
  }

  disconnect() {
    this.emit('disconnect');
    this.namespace.removeSocket(this);
    this.listeners = {};
  }
}
