import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { _ } from 'tnp-core';

@Component({
  selector: 'app-my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEntityComponent implements OnInit {
  @HostBinding('style.minHeight.px') @Input() height: number = 100;
  @Output() myEntityDataChanged = new EventEmitter();
  @Input() myEntityData: any = {};

  constructor() {}

  ngOnInit() {}
}
