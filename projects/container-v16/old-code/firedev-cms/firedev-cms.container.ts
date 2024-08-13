//#region imports
import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { _ } from 'tnp-core/src';
//#endregion

@Component({
  //#region component options
  selector: 'app-firedev-cms',
  templateUrl: './firedev-cms.container.html',
  styleUrls: ['./firedev-cms.container.scss'],
  //#endregion
})
export class FiredevCmsContainer {
  // @Input() FiredevCms = FiredevCms;
  // firedevCms$ = this.FiredevCms.$getAll().pipe(map(data => {
  //   return data.body.json;
  // }))

  @Input() @HostBinding('style.height.px') @Input() height = window.outerHeight;

  myId: number;

  @Input({
    required: false,
  })
  set id(v: string) {
    this.myId = Number(v);
  }

  constructor() {}

  ngOnInit() {}
}
