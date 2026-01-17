import { createContext } from '../create-context';
import { TaonGlobalStateContext } from '../global-state/taon-global-state/taon-global-state.abstract.context';
import { TaonBaseFileUploadMiddleware } from './base-file-upload.middleware';
import { TaonBaseRepository } from './base-repository';

const TaonBaseContext = createContext(() => ({
  contextName: 'TaonBaseContext',
  abstract: true,
  contexts: {
    TaonGlobalStateContext,
  },
  middlewares: {
    TaonBaseFileUploadMiddleware,
  },
  repositories: {
    // @ts-ignore
    TaonBaseRepository,
  },
}));

export { TaonBaseContext };
