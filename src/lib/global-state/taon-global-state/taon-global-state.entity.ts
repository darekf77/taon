//#region imports

import { CreateDateColumn, CustomColumn } from '../../orm/columns';
import { _ } from 'tnp-core/src';

import { TaonGlobalStateDefaultsValues } from './taon-global-state.constants';
import { TaonGlobalStateStatus } from './taon-global-state.models';
import { TaonBaseEntity } from '../../base-classes/base-entity';
import { TaonBaseAbstractEntity } from '../../base-classes/base-abstract-entity';
import { TaonEntity } from '../../decorators/classes/entity-decorator';
//#endregion

@TaonEntity({
  className: 'TAON_GLOBAL_STATE',
  createTable: true,
})
export class TAON_GLOBAL_STATE extends TaonBaseAbstractEntity<TAON_GLOBAL_STATE> {
  //#region @websql
  @CustomColumn({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: TaonGlobalStateDefaultsValues.status,
  })
  //#endregion
  status?: TaonGlobalStateStatus;

  //#region @websql
  @CreateDateColumn()
  //#endregion
  createdAt: Date;

  //#region @websql
  @CustomColumn({
    type: 'int',
    nullable: true,
  })
  //#endregion
  secondsBeforeReadonly: Date;
}
