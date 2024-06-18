import { createContext } from '../create-context';
import { BaseRepository } from './base-repository';

const BaseContext = createContext(() => ({
  contextName: 'BaseContext',
  abstract: true,
  repositories: {
    // @ts-ignore
    BaseRepository,
  },
}));

export { BaseContext };
