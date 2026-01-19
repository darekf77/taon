//#region imports

import {
  CreateDateColumn,
  NumberColumn,
  String100Column,
  String20Column,
} from '../../orm/columns';
import { CustomColumn } from '../../orm/columns';
import { DateTimeColumn } from '../../orm/columns';
import { StringColumn } from '../../orm/columns';
import { Taon } from '../../index';
import { TaonBaseAbstractEntity } from '../../base-classes/base-abstract-entity';
import { TaonEntity } from '../../decorators/classes/entity-decorator';
import { _ } from 'tnp-core/src';

import { TaonTransactionRegistryDefaultsValues } from './taon-transaction-registry.constants';
import { TaonTransactionRegistryState } from './taon-transaction-registry.models';
//#endregion

@TaonEntity({
  className: 'TAON_TANSACTION_REGISTRY',
  createTable: true,
})
export class TAON_TANSACTION_REGISTRY extends TaonBaseAbstractEntity<TAON_TANSACTION_REGISTRY> {

  /**
   * Taon worker index
   */
  //#region @websql
  @NumberColumn()
  //#endregion
  workerIndex: number; // app instance / worker

  //#region @websql
  @String100Column()
  //#endregion
  contextName: string; // "order-create", "migration", etc.

  //#region @websql
  @CreateDateColumn()
  //#endregion
  startedAt: Date;

  //#region @websql
  @DateTimeColumn()
  //#endregion
  finishedAt?: Date;

  //#region @websql
  @String20Column(TaonTransactionRegistryState.RUNNING)
  //#endregion
  state: TaonTransactionRegistryState;
}
