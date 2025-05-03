//#region imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnInit,
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
export class MyEntityPageComponent implements OnInit {
  @Input() taonCtx: TaonContext;
  helloWorld?: Signal<string>;
  readonly myEntityApiService: MyEntityApiService = inject(MyEntityApiService);
  ngOnInit(): void {
    this.myEntityApiService.init(this.taonCtx);

    this.helloWorld = toSignal(this.myEntityApiService.helloWorld('myEntity'), {
      initialValue: '',
      // suspense: 'Loading...',
      // Optionally: error handling
      // error: (e) => `Error: ${e.message}`
    });
  }
}
