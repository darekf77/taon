import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  standalone: true,
})
export class MyEntityComponent implements OnInit {
  // @HostBinding('style.minHeight.px') @Input() height: number = 100;
  // @Output() myEntityDataChanged = new EventEmitter();
  // @Input() myEntityData: any = {};
  ngOnInit(): void { }
}
