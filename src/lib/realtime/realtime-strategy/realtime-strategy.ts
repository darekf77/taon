import { EndpointContext } from '../../endpoint-context';
import type { Server, ServerOptions } from 'socket.io';
import type { io } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export abstract class RealtimeStrategy {
  constructor(protected ctx: EndpointContext) {}

  get ioClient(): typeof io {
    throw new Error('Not implemented');
  }

  ioServer(
    url: string,
    opt: ServerOptions,
  ): Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
    throw new Error('Not implemented');
  }

  abstract toString(): string;
}
