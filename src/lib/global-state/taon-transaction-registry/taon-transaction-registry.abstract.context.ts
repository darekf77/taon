//#region imports
import { createContext, TaonBaseContext } from 'taon/src';

import { TAON_TANSACTION_REGISTRY } from './taon-transaction-registry.entity';
import { TaonTransactionRegistryController } from './taon-transaction-registry.controller';
import { TaonTransactionRegistryRepository } from './taon-transaction-registry.repository';
import { TaonTransactionRegistryProvider } from './taon-transaction-registry.provider';
import { TaonTransactionRegistryMiddleware } from './taon-transaction-registry.middleware';
import { TaonTransactionRegistrySubscriber } from './taon-transaction-registry.subscriber';
//#endregion

export const TaonTransactionRegistryContext = createContext(() => ({
  contextName: 'TaonTransactionRegistryContext',
  abstract: true,
  contexts: { TaonBaseContext },
  entities: { TAON_TANSACTION_REGISTRY },
  controllers: { TaonTransactionRegistryController },
  repositories: { TaonTransactionRegistryRepository },
  providers: { TaonTransactionRegistryProvider },
  middlewares: { TaonTransactionRegistryMiddleware },
  subscribers: { TaonTransactionRegistrySubscriber },
}));