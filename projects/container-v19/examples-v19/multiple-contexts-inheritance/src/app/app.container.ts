//#region imports
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { _ } from 'tnp-core/src';
//#endregion

@Component({
  //#region component options
  selector: 'app-app',
  templateUrl: './app.container.html',
  styleUrls: ['./app.container.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  //#endregion
})
export class AppContainer implements OnInit {
  ngOnInit(): void {

  }
}