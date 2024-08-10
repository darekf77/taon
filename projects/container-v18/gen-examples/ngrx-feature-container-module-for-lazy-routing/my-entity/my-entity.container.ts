//#region @browser
import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MyEntityInitialState } from './my-entity.models';
import * as myEntitySelectors from './selectors/my-entity.selectors';
import * as myEntityAction from './actions/my-entity.actions';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-my-entity',
  templateUrl: './my-entity.container.html',
  styleUrls: ['./my-entity.container.scss']
})
export class MyEntityContainer implements OnInit {
  constructor(
    private store: Store<MyEntityInitialState>
  ) { }

  allData$: Observable<any>;

  @Input('id') // from routing
  set id(idFromRouting: string) {
    if (idFromRouting) {
      this.allData$ = this.store.select(myEntitySelectors.filterAllBatchesBy(idFromRouting));
    } else {
      this.allData$ = of([]);
    }
  }

  trackByMethod(index: number, item: any): number {
    return item.id;
  }

  undo() {
    this.store.dispatch(myEntityAction.UNDO({}))
  }

  ngOnInit() { }

}
//#endregion
