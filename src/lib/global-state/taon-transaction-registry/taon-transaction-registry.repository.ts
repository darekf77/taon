//#region imports

import { TaonBaseRepository } from '../../base-classes/base-repository';
import { TaonRepository } from '../../decorators/classes/repository-decorator';
import { Raw } from 'taon-typeorm/src';

import { TAON_TANSACTION_REGISTRY } from './taon-transaction-registry.entity';
//#endregion

@TaonRepository({
  className: 'TaonTransactionRegistryRepository',
})
export class TaonTransactionRegistryRepository extends TaonBaseRepository<TAON_TANSACTION_REGISTRY> {
  entityClassResolveFn: () => typeof TAON_TANSACTION_REGISTRY = () => TAON_TANSACTION_REGISTRY;

  /**
   * TODO remove this demo example method
   */
  async countEntitesWithEvenId(): Promise<number> {
    //#region @websqlFunc
    const result = await this.count({
      where: {
        id: Raw(alias => `${alias} % 2 = 0`),
      },
    });
    return result;
    //#endregion
  }
}
