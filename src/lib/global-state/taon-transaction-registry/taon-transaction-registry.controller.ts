//#region imports

import { Taon } from '../../index';
import { ClassHelpers } from '../../helpers/class-helpers';
import { TaonController } from '../../decorators/classes/controller-decorator';
import { TaonBaseCrudController } from '../../base-classes/base-crud-controller';
import { Query } from '../../decorators/http/http-params-decorators';
import { GET, POST } from '../../decorators/http/http-methods-decorators';
import { _ } from 'tnp-core/src';

import { TAON_TANSACTION_REGISTRY } from './taon-transaction-registry.entity';
import { TaonTransactionRegistryRepository } from './taon-transaction-registry.repository';
//#endregion

@TaonController({
  className: 'TaonTransactionRegistryController',
})
export class TaonTransactionRegistryController extends TaonBaseCrudController<TAON_TANSACTION_REGISTRY> {
  entityClassResolveFn: () => typeof TAON_TANSACTION_REGISTRY = () =>
    TAON_TANSACTION_REGISTRY;

  taonTransactionRegistryRepository = this.injectCustomRepo(
    TaonTransactionRegistryRepository,
  );

  //#region methods & getters / hello world
  @POST()
  startTransaction(@Query('serviceName') yourName: string): Taon.Response<TAON_TANSACTION_REGISTRY> {
    //#region @websqlFunc
    return async (req, res) => {
      // TODO @LAST
      //  return this.taonTransactionRegistryRepository.startTransaction(yourName);
      return void 0;
    };
    //#endregion
  }
  //#endregion
}
