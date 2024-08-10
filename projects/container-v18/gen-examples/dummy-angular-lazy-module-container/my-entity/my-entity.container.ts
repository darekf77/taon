//#region imports
import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { _ } from 'tnp-core';
//#endregion

@Component({
  //#region component options
  selector: 'app-my-entity',
  templateUrl: './my-entity.container.html',
  styleUrls: ['./my-entity.container.scss'],
  //#endregion
})
export class MyEntityContainer {

  // @Input() MyEntity = MyEntity;
  // myEntity$ = this.MyEntity.$getAll().pipe(map(data => {
  //   return data.body.json;
  // }))

  myId: number;

  @Input({
    required: false
  })
  set id(v: string) {
    this.myId = Number(v);
  }

  constructor() { }

  ngOnInit() {
  }

}
