//#region imports

import { createContext } from '../../create-context';
import { TAON_GLOBAL_STATE } from './taon-global-state.entity';
import { TaonGlobalStateController } from './taon-global-state.controller';
import { TaonGlobalStateRepository } from './taon-global-state.repository';
import { TaonGlobalStateProvider } from './taon-global-state.provider';
import { TaonGlobalStateMiddleware } from './taon-global-state.middleware';
import { TaonGlobalStateSubscriber } from './taon-global-state.subscriber';
//#endregion

export const TaonGlobalStateContext = createContext(() => ({
  contextName: 'TaonGlobalStateContext',
  abstract: true,
  entities: { TAON_GLOBAL_STATE },
  controllers: { TaonGlobalStateController },
  repositories: { TaonGlobalStateRepository },
  providers: { TaonGlobalStateProvider },
  middlewares: { TaonGlobalStateMiddleware },
  subscribers: { TaonGlobalStateSubscriber },
}));
