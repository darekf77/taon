import { createContext } from '../create-context';

import { BaseFileUploadMiddleware } from './base-file-upload.middleware';
import { BaseRepository } from './base-repository';

const BaseContext = createContext(() => ({
  contextName: 'BaseContext',
  abstract: true,
  middlewares: {
    BaseFileUploadMiddleware,
  },
  repositories: {
    // @ts-ignore
    BaseRepository,
  },
}));

export { BaseContext };
