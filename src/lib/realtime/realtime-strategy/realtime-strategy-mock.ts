import { Server } from 'socket.io';
import { EndpointContext } from '../../endpoint-context';
import { RealtimeStrategy } from './realtime-strategy';
import { MockServer, mockIo } from './realtime-strategy-mock-models'

/**
 * Purpose:
 * - browser-browser communication mock (in websql mode)
 */
export class RealtimeStrategyMock extends RealtimeStrategy {


  constructor(protected ctx: EndpointContext) {
    super(ctx);
  }

  get Server() {
    return MockServer as any;
  };

  get io() {
    return mockIo as any;
  }

  establishConnection(): void {
    throw new Error('Method not implemented.');
  }

}
