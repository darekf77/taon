import { createContext } from '../create-context';

import { TaonBaseFileUploadMiddleware } from './base-file-upload.middleware';
import { TaonBaseRepository } from './base-repository';

const TaonBaseContext = createContext(() => ({
  contextName: 'TaonBaseContext',
  abstract: true,
  middlewares: {
    TaonBaseFileUploadMiddleware,
  },
  repositories: {
    // @ts-ignore
    TaonBaseRepository,
  },
}));

export { TaonBaseContext };
