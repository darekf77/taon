//#region imports
import { ChangeDetectionStrategy, Component, inject, Input, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntityComponent } from '../my-entity/my-entity.component';
import { MyEntityApiService } from '../../my-entity-api.service';
import { Observable, of } from 'rxjs';
import { MyEntity } from '../../my-entity';
import { toSignal } from '@angular/core/rxjs-interop';
//#endregion

@Component({
  selector: 'my-entity-page',
  templateUrl: './my-entity-page.component.html',
  styleUrls: ['./my-entity-page.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MyEntityComponent,
  ],
  providers:[MyEntityApiService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEntityPageComponent implements OnInit {
  @Input() ctx: any;
  helloWorld?: Signal<string>;
  readonly myEntityApiService:MyEntityApiService = inject(MyEntityApiService);
  ngOnInit(): void {
    this.myEntityApiService.init(this.ctx);

    this.helloWorld = toSignal(
      this.myEntityApiService.helloWorld('myEntity'),
      {
        initialValue: '',
        suspense: 'Loading...',
        // Optionally: error handling
        // error: (e) => `Error: ${e.message}`
      }
    );
  }
}
