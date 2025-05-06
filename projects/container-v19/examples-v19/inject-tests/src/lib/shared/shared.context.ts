import { BaseContext, Taon, createContext } from 'taon/src';

import { Admin } from './admin/admin';
import { AdminController } from './admin/admin.controller';
import { EmailContext } from './email';
import { Session } from './session/sesison';
import { SessionController } from './session/session.controller';
import { User } from './user/user';
import { UserController } from './user/user.controller';
import { UserRepository } from './user/user.repository';

export const SharedContext = createContext(() => ({
  contextName: 'SharedContext',
  // host: 'http://abstract.host.com',
  abstract: true,
  contexts: { BaseContext, EmailContext },
  entities: {
    User,
    //  Session, Admin
  },
  controllers: {
    // SessionController,
    UserController,
    // AdminController
  },
  repositories: { UserRepository },
}));
