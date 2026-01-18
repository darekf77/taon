//#region imports

import { TaonBaseSubscriberForEntity } from '../../base-classes/base-subscriber-for-entity';
import { TaonSubscriber } from '../../decorators/classes/subscriber-decorator';

import { TAON_TANSACTION_REGISTRY } from './taon-transaction-registry.entity';
import { TaonTransactionRegistryProvider } from './taon-transaction-registry.provider';
//#endregion

@TaonSubscriber<TaonTransactionRegistrySubscriber>({
  className: 'TaonTransactionRegistrySubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonTransactionRegistrySubscriber extends TaonBaseSubscriberForEntity {
  taonTransactionRegistryProvider = this.injectProvider(TaonTransactionRegistryProvider);

  listenTo(): typeof TAON_TANSACTION_REGISTRY {
    return TAON_TANSACTION_REGISTRY;
  }
}
