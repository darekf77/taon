//#region imports
import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { _ } from 'tnp-core';
//#endregion

@Component({
  //#region component options
  selector: 'app-my-entity',
  templateUrl: './my-entity.container.html',
  styleUrls: ['./my-entity.container.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  //#endregion
})
export class MyEntityContainer implements OnInit {
  ngOnInit(): void {

  }
}
