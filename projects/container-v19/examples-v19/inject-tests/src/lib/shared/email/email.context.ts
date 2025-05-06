//#region imports
import { Taon, BaseContext } from 'taon/src';

import { Email } from './email';
import { EmailController } from './email.controller';
import { EmailRepository } from './email.repository';
//#endregion

export const EmailContext = Taon.createContext(() => ({
  contextName: 'EmailContext',
  abstract: true,
  contexts: { BaseContext },
  entities: { Email },
  controllers: { EmailController },
  repositories: { EmailRepository },
}));
