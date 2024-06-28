import { EndpointContext } from '../../endpoint-context';
import type { Server } from 'socket.io';
import type { io } from 'socket.io-client';

export abstract class RealtimeStrategy {
  constructor(protected ctx: EndpointContext) {}

  private testTypes() {
    // io(s)
  }

  abstract establishConnection(): void;

  abstract readonly io: typeof io;
  abstract readonly Server: typeof Server;
  abstract toString(): string;
}
