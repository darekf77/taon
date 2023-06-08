//#region @browser
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as myEntityActions from '../actions/my-entity.actions'
import { switchMap, map, of } from "rxjs";
import { MyEntityService } from '../services/my-entity.service';
import { Store } from '@ngrx/store';
import { MyEntityInitialState } from '../my-entity.models';

@Injectable()
export class MyEntityEffects {
  constructor(private actions$: Actions, private service: MyEntityService, private store: Store<MyEntityInitialState>) { }

  init = createEffect(() => this.actions$.pipe(
    ofType(myEntityActions.INIT),
    switchMap(() => of(myEntityActions.FETCH()))
  ));

}
//#endregion
