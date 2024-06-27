import { MockNamespace } from "./realtime-strategy-mock-namespaces";
import { MockSocket } from "./realtime-strategy-mock-socket";
import { Namespaces } from "./realtime-strategy-mock.models";

export class MockServer {
  private namespaces: Namespaces = {
    '/': new MockNamespace('/', this.contextName)
  };

  constructor(public contextName: string) {}

  of(namespace: string): MockNamespace {
    if (!this.namespaces[namespace]) {
      this.namespaces[namespace] = new MockNamespace(namespace, this.contextName);
    }
    return this.namespaces[namespace];
  }

  on(event: string, callback: (socket: MockSocket) => void) {
    if (event === 'connection') {
      this.namespaces['/'].on('connection', callback);
    }
  }

  emit(event: string, data?: any) {
    this.namespaces['/'].emit(event, data);
  }

  connect(id: string, namespace: string = '/'): MockSocket {
    const ns = this.of(namespace);
    const socket = new MockSocket(id, ns);
    ns.on('connection', (socket: MockSocket) => {
      socket.emit('connect');
    });
    return socket;
  }
}
