import { createContext } from '../create-context';
import { BaseRepository } from './base-repository';

export const BaseContext = createContext({
  contextName: 'AppContext',
  abstract: true,
  repositories: {
    BaseRepository,
  },
});
