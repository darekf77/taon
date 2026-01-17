//#region imports

import { TaonBaseRepository } from '../../base-classes/base-repository';
import { TaonRepository } from '../../decorators/classes/repository-decorator';
import { Raw } from 'taon-typeorm/src';

import { TAON_GLOBAL_STATE } from './taon-global-state.entity';
import { TaonGlobalStateStatus } from './taon-global-state.models';
import { TaonGlobalStateUtils } from './taon-global-state.utils';
//#endregion

@TaonRepository({
  className: 'TaonGlobalStateRepository',
})
export class TaonGlobalStateRepository extends TaonBaseRepository<TAON_GLOBAL_STATE> {
  entityClassResolveFn: () => typeof TAON_GLOBAL_STATE = () => TAON_GLOBAL_STATE;

  async getLastStatus(): Promise<TAON_GLOBAL_STATE> {
    //#region @websqlFunc
    const lastStatus = await this.findOne({
      order: { createdAt: 'DESC' },
    });
    return lastStatus;
    //#endregion
  }

  async setDraining(secondsBeforeReadonly = 0): Promise<void> {
    //#region @websqlFunc
    await this.transitionTo(TaonGlobalStateStatus.DRAINING);
    if (secondsBeforeReadonly > 0) {
      setTimeout(async () => {
        await this.transitionTo(TaonGlobalStateStatus.READONLY);
      }, secondsBeforeReadonly);
    }
    //#endregion
  }

  async transitionTo(next: TaonGlobalStateStatus): Promise<TAON_GLOBAL_STATE> {
    //#region @websqlFunc
    const current = await this.getLastStatus();
    TaonGlobalStateUtils.assertAllowedTransition(current.status, next);
    const newState = this.create({ status: next });
    await this.save(newState);
    return newState;
    //#endregion
  }
}
