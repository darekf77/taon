import { Taon } from '../../index';
import { TaonBaseAngularService } from '../../base-classes/base-angular-service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { TAON_TANSACTION_REGISTRY } from './taon-transaction-registry.entity';
import { TaonTransactionRegistryController } from './taon-transaction-registry.controller';

@Injectable()
export class TaonTransactionRegistryApiService extends TaonBaseAngularService {
  private taonTransactionRegistryController = this.injectController(
    TaonTransactionRegistryController,
  );

  public get allMyEntities$(): Observable<TAON_TANSACTION_REGISTRY[]> {
    return this.taonTransactionRegistryController.getAll()
      .request!().observable.pipe(map(res => res.body?.json));
  }
}
