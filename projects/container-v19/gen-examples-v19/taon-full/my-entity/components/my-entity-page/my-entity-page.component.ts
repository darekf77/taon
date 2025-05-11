//#region imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TaonContext } from 'taon/src';

import { MyEntityApiService } from '../../my-entity-api.service';
import { MyEntityComponent } from '../my-entity/my-entity.component';
//#endregion

@Component({
  selector: 'my-entity-page',
  templateUrl: './my-entity-page.component.html',
  styleUrls: ['./my-entity-page.component.scss'],
  standalone: true,
  imports: [CommonModule, MyEntityComponent],
  providers: [MyEntityApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEntityPageComponent {
  @Input() taonCtx: TaonContext;
  helloWorld?: Signal<string>;
  readonly myEntityApiService: MyEntityApiService = inject(MyEntityApiService);
  constructor() {
    this.helloWorld = toSignal(this.myEntityApiService.helloWorld('myEntity'), {
      initialValue: '',
    });
  }
}
