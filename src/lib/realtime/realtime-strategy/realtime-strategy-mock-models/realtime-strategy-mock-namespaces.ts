import { MockSocket } from "./realtime-strategy-mock-socket";
import { Rooms } from "./realtime-strategy-mock.models";
export class MockNamespace {
  private rooms: Rooms = {};
  private sockets: Set<MockSocket> = new Set();

  constructor(public name: string, public contextName: string) {}

  on(event: string, callback: (socket: MockSocket) => void) {
    if (event === 'connection') {
      this.sockets.forEach(socket => callback(socket));
    }
  }

  emit(event: string, data?: any) {
    this.sockets.forEach(socket => socket.emit(event, data));
  }

  to(room: string) {
    return {
      emit: (event: string, data?: any) => {
        if (this.rooms[room]) {
          this.rooms[room].forEach(socket => socket.emit(event, data));
        }
      }
    };
  }

  joinRoom(socket: MockSocket, room: string) {
    if (!this.rooms[room]) {
      this.rooms[room] = new Set();
    }
    this.rooms[room].add(socket);
  }

  leaveRoom(socket: MockSocket, room: string) {
    if (this.rooms[room]) {
      this.rooms[room].delete(socket);
      if (this.rooms[room].size === 0) {
        delete this.rooms[room];
      }
    }
  }

  addSocket(socket: MockSocket) {
    this.sockets.add(socket);
  }

  removeSocket(socket: MockSocket) {
    this.sockets.delete(socket);
  }
}
