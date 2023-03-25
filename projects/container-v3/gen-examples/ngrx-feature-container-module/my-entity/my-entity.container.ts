//#region @browser
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MyEntityInitialState } from './my-entity.models';
import * as myEntitySelectors from './selectors/my-entity.selectors';
import * as myEntityAction from './actions/my-entity.actions';

@Component({
  selector: 'app-my-entity',
  templateUrl: './my-entity.container.html',
  styleUrls: ['./my-entity.container.scss']
})
export class MyEntityContainer implements OnInit {
  constructor(
    private store: Store<MyEntityInitialState>
  ) { }
  allData$ = this.store.select(myEntitySelectors.allBatches);
  allowedToUndo$ = this.store.select(myEntitySelectors.allowedToUndo);

  trackByMethod(index: number, item: any): number {
    return item.id;
  }

  undo() {
    this.store.dispatch(myEntityAction.UNDO({}))
  }

  ngOnInit() { }

}
//#endregion
