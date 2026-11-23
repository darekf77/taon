import { createContext } from '../create-context';

import { TaonBaseFileUploadMiddleware } from './base-file-upload.middleware';
import { TaonBaseRepository } from './base-repository';

const createTaonBaseContext = () =>
  createContext(() => ({
    contextName: 'TaonBaseContext',
    abstract: true,
    contexts: {},
    middlewares: {
      TaonBaseFileUploadMiddleware,
    },
    repositories: {
       // @ts-ignore
      TaonBaseRepository,
    },
  }));

type TaonBaseContextType = ReturnType<typeof createTaonBaseContext>;

let instance: TaonBaseContextType | undefined;

const getInstance = (): TaonBaseContextType => {
  return (instance ??= createTaonBaseContext());
};

export const TaonBaseContext = new Proxy({} as TaonBaseContextType, {
  get(_target, property) {
    return Reflect.get(getInstance(), property);
  },

  set(_target, property, value) {
    return Reflect.set(getInstance(), property, value);
  },
});
