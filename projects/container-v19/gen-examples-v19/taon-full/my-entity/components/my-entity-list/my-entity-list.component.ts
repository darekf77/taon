//#region imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Observable, of } from 'rxjs';

import { MyEntity } from '../../my-entity';
import { MyEntityApiService } from '../../my-entity-api.service';
import { MyEntityComponent } from '../my-entity/my-entity.component';
//#endregion

@Component({
  selector: 'my-entity-list',
  templateUrl: './my-entity-list.component.html',
  styleUrls: ['./my-entity-list.component.scss'],
  standalone: true,
  imports: [CommonModule, MyEntityComponent],
  providers: [MyEntityApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEntityListComponent {
  allMyEntities$: Observable<MyEntity[]> = of([]);
  readonly myEntityApiService: MyEntityApiService = inject(MyEntityApiService);
  constructor() {
    this.allMyEntities$ = this.myEntityApiService.allMyEntities$;
  }
}
