//#region @browser
import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-entity',
  templateUrl: './my-entity.container.html',
  styleUrls: ['./my-entity.container.scss']
})
export class MyEntityContainer implements OnInit {

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
//#endregion
