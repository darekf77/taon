import { BaseContext, Firedev, createContext } from 'firedev/src';
import { Session } from './session/sesison';
import { User } from './user/user';
import { UserController } from './user/user.controller';
import { SessionController } from './session/session.controller';
import { Admin } from './admin/admin';
import { UserRepository } from './user/user.repository';
import { AdminController } from './admin/admin.controller';

export const SharedContext = createContext(() => ({
  contextName: 'SharedContext',
  host: 'http://abstract.host.com',
  contexts: { BaseContext },
  entities: { User, Session, Admin },
  controllers: { SessionController, UserController, AdminController },
  repositories: { UserRepository },
}));

