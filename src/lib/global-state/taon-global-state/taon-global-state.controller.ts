//#region imports

import { Taon } from '../../index';
import { ClassHelpers } from '../../helpers/class-helpers';
import { TaonController } from '../../decorators/classes/controller-decorator';
import { TaonBaseCrudController } from '../../base-classes/base-crud-controller';
import { Query } from '../../decorators/http/http-params-decorators';
import { GET } from '../../decorators/http/http-methods-decorators';
import { PUT } from '../../decorators/http/http-methods-decorators';
import { POST } from '../../decorators/http/http-methods-decorators';
import { _, Utils, UtilsOs, UtilsTerminal } from 'tnp-core/src';

import { TAON_GLOBAL_STATE } from './taon-global-state.entity';
import { TaonGlobalStateRepository } from './taon-global-state.repository';
import { TaonGlobalStateStatus } from './taon-global-state.models';
//#endregion

@TaonController({
  className: 'TaonGlobalStateController',
})
export class TaonGlobalStateController extends TaonBaseCrudController<TAON_GLOBAL_STATE> {
  entityClassResolveFn: () => typeof TAON_GLOBAL_STATE = () => TAON_GLOBAL_STATE;

  taonGlobalStateRepository = this.injectCustomRepo(TaonGlobalStateRepository);

  @GET()
  getStatus(): Taon.Response<TaonGlobalStateStatus> {
    return async () => {
      //#region @websqlFunc
      const stateEntity = await this.taonGlobalStateRepository.getLastStatus();
      return stateEntity.status;
      //#endregion
    };
  }

  @POST()
  setDraining(
    @Query('secondsBeforeReadonly') secondsBeforeReadonly = 0,
  ): Taon.Response<void> {
    return async () => {
      await this.taonGlobalStateRepository.setDraining(secondsBeforeReadonly);
    };
  }
}
