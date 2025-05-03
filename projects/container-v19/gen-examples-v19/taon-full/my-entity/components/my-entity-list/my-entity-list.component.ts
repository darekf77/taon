//#region imports
import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntityComponent } from '../my-entity/my-entity.component';
import { MyEntityApiService } from '../../my-entity-api.service';
import { Observable, of } from 'rxjs';
import { MyEntity } from '../../my-entity';
//#endregion

@Component({
  selector: 'my-entity-list',
  templateUrl: './my-entity-list.component.html',
  styleUrls: ['./my-entity-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MyEntityComponent,
  ],
  providers:[MyEntityApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEntityListComponent implements OnInit {
  @Input() ctx: any;
  allMyEntities$:Observable<MyEntity[]>  = of([]);
  readonly myEntityApiService:MyEntityApiService = inject(MyEntityApiService);
  ngOnInit(): void {
    this.myEntityApiService.init(this.ctx);
    this.allMyEntities$ = this.myEntityApiService.allMyEntities$;
  }
}
