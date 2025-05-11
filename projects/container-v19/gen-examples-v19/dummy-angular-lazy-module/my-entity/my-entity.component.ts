//#region imports
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { _ } from 'tnp-core';
//#endregion

@Component({
  //#region component options
  selector: 'app-my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  //#endregion
})
export class MyEntityComponent implements OnInit {
  ngOnInit(): void {

  }
}

