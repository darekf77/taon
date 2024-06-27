import { MockServer } from "./realtime-strategy-mock-server";
import { MockSocket } from "./realtime-strategy-mock-socket";
import { EventListeners } from "./realtime-strategy-mock.models";


class MockClientSocket {
  private listeners: EventListeners = {};

  constructor(private serverSocket: MockSocket, public contextName: string) {
    serverSocket.on('message', (data) => this.emit('message', data));
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
    this.serverSocket.emit(event, data);
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data));
    }
  }

  disconnect() {
    this.serverSocket.disconnect();
    this.listeners = {};
  }

  join(room: string) {
    this.serverSocket.join(room);
  }

  leave(room: string) {
    this.serverSocket.leave(room);
  }
}

export function mockIo(server: MockServer) {
  return (namespace: string = '/'): MockClientSocket => {
    const socketId = Math.random().toString(36).substring(2);
    const serverSocket = server.connect(socketId, namespace);
    return new MockClientSocket(serverSocket, server.contextName);
  };
}

