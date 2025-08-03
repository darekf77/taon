//#region imports
import type { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
import { Symbols } from '../../symbols';
import { ManagerOptions, SocketOptions } from 'socket.io-client';
import { RealtimeModels } from '../realtime.models';
import { ServerOptions } from 'socket.io';
//#endregion

//#region mock server
class MockServer {
  static serverByUrl = new Map<string, MockServer>();
  static from(url: string): MockServer {
    if (!MockServer.serverByUrl.has(url)) {
      MockServer.serverByUrl.set(url, new MockServer(url));
    }
    return MockServer.serverByUrl.get(url);
  }

  get allServers() {
    return Array.from(MockServer.serverByUrl.values());
  }

  namespacesByName = new Map<string, MockNamespace>();

  //#region constructor
  constructor(public url: string) {
    MockServer.serverByUrl.set(url, this);
  }
  //#endregion

  //#region of
  of(namespace: string): MockNamespace {
    if (!this.namespacesByName.has(namespace)) {
      this.namespacesByName.set(namespace, new MockNamespace(namespace, this));
    }
    return this.namespacesByName.get(namespace);
  }
  //#endregion

  //#region path
  path() {
    return this.url;
  }
  //#endregion
}
//#endregion

//#region mock namespace
class MockNamespace {
  /**
   * All sockets connected to this namespace
   */
  public readonly allSocketsForNamespace = new Set<MockSocket>();
  /**
   * Rooms and their sockets
   */
  private socketByRoomName: {
    [roomName: string]: Set<MockSocket>;
  } = {};
  /**
   * Event handlers for this namespace
   */
  public namespaceEventHandlers: {
    [eventName: string]: Set<RealtimeModels.EventHandler>;
  } = {};

  //#region constructor
  constructor(
    /**
     * unique namespace name
     */
    public name: string,
    public server: MockServer,
  ) {}
  //#endregion

  //#region on
  on(eventName: string, handler: RealtimeModels.EventHandler): void {
    // console.log(`ON EVNET event "${eventName}"`);
    if (!this.namespaceEventHandlers[eventName]) {
      this.namespaceEventHandlers[eventName] =
        new Set<RealtimeModels.EventHandler>();
    }

    if (!this.namespaceEventHandlers[eventName].has(handler)) {
      this.namespaceEventHandlers[eventName].add(handler);
    }

    // QUICK_FIX Emit connection event for backend
    // TODO make it in emit
    if (eventName === 'connection') {
      setTimeout(() => {
        this.emit('connection', this);
      });
    }
  }
  //#endregion

  //#region emit
  emit(event: string, ...args: any[]): void {
    this.allSocketsForNamespace?.forEach(socket => {
      socket.emit(event, ...args);
    });
  }
  //#endregion

  //#region connect
  connect(socket: MockSocket): void {
    this.allSocketsForNamespace.add(socket);
    socket.namespaceInstance = this;
  }
  //#endregion

  //#region to
  to(roomName: string): RoomEmitter {
    const socketsInRoom = this.socketByRoomName[roomName];
    return new RoomEmitter(socketsInRoom, true);
  }
  //#endregion

  //#region to room
  in(roomName: string): RoomEmitter {
    const socketsInRoom = this.socketByRoomName[roomName];
    return new RoomEmitter(socketsInRoom, false);
  }
  //#endregion

  //#region join room
  joinRoom(roomName: string, socket: MockSocket): void {
    if (!this.socketByRoomName[roomName]) {
      this.socketByRoomName[roomName] = new Set<MockSocket>();
    }
    this.socketByRoomName[roomName].add(socket);
  }
  //#endregion

  //#region leave room
  leaveRoom(roomName: string, socket: MockSocket): void {
    const roomSockets = this.socketByRoomName[roomName];
    if (roomSockets) {
      this.socketByRoomName[roomName].delete(socket);
    }
  }
  //#endregion

  //#region nsp + name
  get nsp() {
    const self = this;
    return {
      get name() {
        return self.name;
      },
    };
  }
  //#endregion

  path() {
    return this.name;
  }
}
//#endregion

//#region room emitter
class RoomEmitter {
  //#region constructor
  constructor(
    private sockets: Set<MockSocket>,
    private includeSender: boolean = false,
    private sender: MockSocket = null, // TODO QUICK FIX how to include sender
  ) {}
  //#endregion

  //#region emit in room
  emit(event: string, ...args: any[]): void {
    // console.log(
    //   `emit room emiter ${event} ,  this.sockets ${this.sockets.length}`,
    // );
    this.sockets?.forEach(socket => {
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
  public namespaceInstance: MockNamespace;
  private socketEventHandlers = {} as {
    [eventName: string]: Set<RealtimeModels.EventHandler>;
  };
  get id() {
    return this.nsp.name;
  }

  //#region constructor
  constructor(
    public url: string,
    opts?: Partial<ManagerOptions & SocketOptions>,
  ) {
    // @ts-ignore
    const [baseUrl, namespace] = [url, opts.path || '/'];
    // console.log({ url, baseUrl, namespace });
    const namespaceName = namespace || '/';

    // Look up the server instance from the registry
    const server = MockServer.from(url);

    const ns = server.of(namespaceName);
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

  //#region path
  path() {
    return this.namespaceInstance?.name;
  }
  //#endregion

  //#region on
  on(eventName: string, handler: RealtimeModels.EventHandler): void {
    if (!this.socketEventHandlers[eventName]) {
      this.socketEventHandlers[eventName] =
        new Set<RealtimeModels.EventHandler>();
    }
    this.socketEventHandlers[eventName].add(handler);

    // QUICK_FIX client initing itself
    if (eventName === 'connect') {
      setTimeout(() => {
        this.emit('connect');
        // this.namespaceInstance.emit('connection', this); @UNCOMMNENT
      });
    }
  }
  //#endregion

  //#region emit
  emit(eventName: string, ...args: any[]): void {
    eventName = eventName || '';

    if (eventName.includes(`:${Symbols.REALTIME.KEYroomSubscribe}`)) {
      const room = args[0];
      this.join(room);
    } else if (eventName.includes(`:${Symbols.REALTIME.KEYroomUnsubscribe}`)) {
      const room = args[0];
      this.leave(room);
    } else {
      // console.log('try to emit event (to server)', event);
      if (this.namespaceInstance) {
        const namespaceEventHandlers =
          this.namespaceInstance.namespaceEventHandlers[eventName] || [];

        // emit to namespace events
        for (const namespaceEventHandler of namespaceEventHandlers) {
          if (namespaceEventHandler) {
            namespaceEventHandler(...args);
          }
        }

        const allSocketsForNamespaceExceptCurrent = Array.from(
          this.namespaceInstance.allSocketsForNamespace.values(),
        ).filter(socket => socket !== this);

        // emit to all sockets in namespace
        for (const socket of allSocketsForNamespaceExceptCurrent) {
          const socketEventHandlers = socket.socketEventHandlers[eventName];
          for (const socketEventHandler of socketEventHandlers) {
            if (socketEventHandler) {
              socketEventHandler(...args);
            }
          }
        }

        // Emit to current socket
        const socketEventHandlers = this.socketEventHandlers[eventName] || [];
        for (const clientHandler of socketEventHandlers) {
          if (clientHandler) {
            clientHandler(...args);
          }
        }
      }
    }
  }
  //#endregion

  //#region join room
  join(roomName: string): void {
    this.namespaceInstance.joinRoom(roomName, this);
  }
  //#endregion

  //#region leave room
  leave(roomName: string): void {
    this.namespaceInstance.leaveRoom(roomName, this);
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
  ioServer(url: string, opt: ServerOptions) {
    const server = MockServer.from(url || this.ctx.uriOrigin);
    return server.of(opt?.path || '/') as any;
  }

  get ioClient() {
    const clientIo = (
      uri: string,
      opts?: Partial<ManagerOptions & SocketOptions>,
    ): MockSocket => {
      return new MockSocket(uri || this.ctx.uriOrigin, opts as any);
    };
    return clientIo as any;
  }
  //#endregion
}
