import { Taon } from '../../index';
import { TaonBaseAngularService } from '../../base-classes/base-angular-service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


import type { TAON_GLOBAL_STATE } from './taon-global-state.entity';
import { TaonGlobalStateController } from './taon-global-state.controller';

@Injectable()
export class TaonGlobalStateApiService extends TaonBaseAngularService {
  private taonGlobalStateController = this.injectController(TaonGlobalStateController);

  public get allMyEntities$(): Observable<TAON_GLOBAL_STATE[]> {
    return this.taonGlobalStateController.getAll().request!().observable.pipe(
      map(res => res.body?.json),
    );
  }

}
