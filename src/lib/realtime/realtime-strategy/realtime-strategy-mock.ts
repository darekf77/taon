import { Server } from 'socket.io';
import type { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
import { Symbols } from '../../symbols';
import { ManagerOptions, SocketOptions } from 'socket.io-client';

//#region models
type EventHandler = (...args: any[]) => void;
//#endregion

// Global registry to map URLs to MockServer instances
const serverRegistry: { [url: string]: MockServer } = {};

//#region mock server
class MockServer {
  private namespaces: { [key: string]: MockNamespace } = {};

  //#region constructor
  constructor(public url: string) {
    serverRegistry[url] = this;
  }
  //#endregion

  //#region of
  of(namespace: string): MockNamespace {
    if (!this.namespaces[namespace]) {
      this.namespaces[namespace] = new MockNamespace(namespace);
    }
    return this.namespaces[namespace];
  }
  //#endregion

  // emit not implemented - not needed for this mock
}
//#endregion

//#region mock namespace
class MockNamespace {
  public name: string;
  private sockets: MockSocket[] = [];
  private rooms: { [key: string]: MockSocket[] } = {};
  public eventHandlers: { [event: string]: EventHandler } = {};

  //#region constructor
  constructor(name: string) {
    this.name = name;
  }
  //#endregion

  //#region on
  on(event: string, handler: EventHandler): void {
    this.eventHandlers[event] = handler;
  }
  //#endregion

  //#region emit
  emit(event: string, ...args: any[]): void {
    this.sockets.forEach(socket => {
      socket.emit(event, ...args);
    });
  }
  //#endregion

  //#region connect
  connect(socket: MockSocket): void {
    this.sockets.push(socket);
    socket.namespaceInstance = this;
  }
  //#endregion

  //#region to
  to(roomName: string, includeSender: boolean = false): RoomEmitter {
    const socketsInRoom = this.rooms[roomName] || [];
    // console.log(
    //   `to room "${roomName}" in namespace "${this.name}" , socketsInRoom: ${socketsInRoom.join(',')}`,
    // );
    return new RoomEmitter(socketsInRoom, includeSender);
  }
  //#endregion

  //#region join room
  joinRoom(roomName: string, socket: MockSocket): void {
    if (!this.rooms[roomName]) {
      this.rooms[roomName] = [];
    }
    if (!this.rooms[roomName].includes(socket)) {
      this.rooms[roomName].push(socket);
    }
  }
  //#endregion

  //#region leave room
  leaveRoom(roomName: string, socket: MockSocket): void {
    const roomSockets = this.rooms[roomName];
    if (roomSockets) {
      this.rooms[roomName] = roomSockets.filter(s => s !== socket);
    }
  }
  //#endregion
}
//#endregion

//#region room emitter
class RoomEmitter {
  private sockets: MockSocket[];
  private includeSender: boolean;
  private sender: MockSocket | null;

  //#region constructor
  constructor(
    sockets: MockSocket[],
    includeSender: boolean = false,
    sender: MockSocket | null = null,
  ) {
    this.sockets = sockets;
    this.includeSender = includeSender;
    this.sender = sender;
    // console.log(`RoomEmitter created, sockets: ${this.sockets.length}`);
  }
  //#endregion

  //#region emit in room
  emit(event: string, ...args: any[]): void {
    // console.log(
    //   `emit room emiter ${event} ,  this.sockets ${this.sockets.length}`,
    // );
    this.sockets.forEach(socket => {
      // console.log(`emit event ${event} to socket ${socket.id}`);
      if (this.includeSender || socket !== this.sender) {
        socket.emit(event, ...args);
      }
    });
  }
  //#endregion
}
//#endregion

//#region mock socket
class MockSocket {
  private static connectionCounter = 0;
  private static sockets = new Map<string, MockSocket>();

  public namespaceName: string;
  public namespaceInstance: MockNamespace | null = null;
  private eventHandlers: { [event: string]: EventHandler } = {};
  private rooms: Set<string> = new Set();
  private ctx: EndpointContext;

  get id() {
    return this.nsp.name;
  }

  //#region constructor
  constructor(
    url: string,
    opts?: Partial<ManagerOptions & SocketOptions>,
    ctx?: EndpointContext,
  ) {
    MockSocket.connectionCounter++;

    this.ctx = ctx as EndpointContext;
    url = url || this.ctx.uri.origin;

    // @ts-ignore
    const [baseUrl, namespace] = [url, opts.path || '/'];
    // console.log({ url, baseUrl, namespace });
    this.namespaceName = namespace || '/';

    // Look up the server instance from the registry
    let server = serverRegistry[url];
    if (!server) {
      serverRegistry[url] = new MockServer(url);
      server = serverRegistry[url];
    }

    const ns = server.of(this.namespaceName);
    ns.connect(this);
  }
  //#endregion

  //#region nsp + name
  get nsp() {
    const self = this;
    return {
      get name() {
        return self.namespaceInstance?.name;
      },
    };
  }
  //#endregion

  //#region on
  on(event: string, handler: EventHandler): void {
    if (event === 'connect' || event === 'connection') {
      setTimeout(() => {
        handler(this);
      });
    } else {
      this.eventHandlers[event] = handler;
    }
  }
  //#endregion

  //#region emit
  emit(event: string, ...args: any[]): void {
    // console.log(`emit event ${event} to socket ${this.id}`);
    // Emit to server-side handlers

    const [contextName, eventName] = event.split(':');

    if (eventName.startsWith(Symbols.REALTIME.KEY.roomSubscribe)) {
      const room = args[0];
      this.join(room);
    } else if (eventName.startsWith(Symbols.REALTIME.KEY.roomUnsubscribe)) {
      const room = args[0];
      this.leave(room);
    } else {
      // console.log('try to emit event (to server)', event);
      if (this.namespaceInstance) {
        const serverHandler = this.namespaceInstance.eventHandlers[event];
        if (serverHandler) {
          serverHandler(this, ...args);
          return;
        }
      }

      // Emit to client-side handlers
      const clientHandler = this.eventHandlers[event];
      if (clientHandler) {
        clientHandler(...args);
      }
    }
  }
  //#endregion

  //#region join room
  join(room: string): void {
    this.rooms.add(room);
    this.namespaceInstance.joinRoom(room, this);
  }
  //#endregion

  //#region leave room
  leave(room: string): void {
    this.rooms.delete(room);
    this.namespaceInstance.leaveRoom(room, this);
  }
  //#endregion

  //#region to room
  to(room: string): RoomEmitter {
    if (this.namespaceInstance) {
      return this.namespaceInstance.to(room, false)['excludeSender'](this);
    }
    return new RoomEmitter([], false);
  }
  //#endregion

  //#region in room
  in(room: string): RoomEmitter {
    if (this.namespaceInstance) {
      return this.namespaceInstance.to(room, true);
    }
    return new RoomEmitter([], true);
  }
  //#endregion
}
//#endregion

/**
 * Purpose:
 * - browser-browser communication mock (in websql mode)
 */
export class RealtimeStrategyMock extends RealtimeStrategy {
  //#region toString
  toString(): string {
    return 'mock';
  }
  //#endregion

  //#region constructor
  constructor(protected ctx: EndpointContext) {
    super(ctx);
  }
  //#endregion

  //#region server & io
  get Server() {
    return MockSocket as any;
  }

  get io() {
    const clientIo = (
      uri: string,
      opts?: Partial<ManagerOptions & SocketOptions>,
    ): MockSocket => {
      return new MockSocket(uri, opts as any, this.ctx);
    };
    return clientIo as any;
  }
  //#endregion
}
