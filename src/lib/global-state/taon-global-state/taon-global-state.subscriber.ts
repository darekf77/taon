//#region imports

import { TaonBaseSubscriberForEntity } from '../../base-classes/base-subscriber-for-entity';
import { TaonSubscriber } from '../../decorators/classes/subscriber-decorator';
import { TAON_GLOBAL_STATE } from './taon-global-state.entity';
import { TaonGlobalStateProvider } from './taon-global-state.provider';
//#endregion

@TaonSubscriber<TaonGlobalStateSubscriber>({
  className: 'TaonGlobalStateSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonGlobalStateSubscriber extends TaonBaseSubscriberForEntity {
  taonGlobalStateProvider = this.injectProvider(TaonGlobalStateProvider);
  listenTo(): typeof TAON_GLOBAL_STATE {
    return TAON_GLOBAL_STATE;
  }
}
