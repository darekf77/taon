import { Taon, BaseContext } from 'taon/src';
import { HOST_BACKEND_PORT } from './app.hosts';
import { UserController } from './app/user.controller';
import { User } from './app/user';
import { UserSubscriber } from './app/user.subscriber';

const host = 'http://localhost:' + HOST_BACKEND_PORT;

export const AppContext = Taon.createContext(() => ({
  host,
  contextName: 'AppContext',
  contexts: { BaseContext },
  controllers: {
    UserController,
    // PUT FIREDEV CONTORLLERS HERE
  },
  entities: {
    User,
    // PUT FIREDEV ENTITIES HERE
  },
  subscribers: { UserSubscriber },
  disabledRealtime: true,
  database: true,
  logs: {
    db: false,
    framework: true,
    http: true,
    realtime: true,
  },
}));
