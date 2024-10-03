//#region imports
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntityComponent } from './my-entity.component';
import { MyEntityApiService } from './my-entity-api.service';
//#endregion

@Component({
  //#region component data
  selector: 'my-entity-list',
  // templateUrl: './my-entity-list.component.html',
  template: `
    <h4>MyEntity List</h4>
    <ul>
      <li *ngFor="let item of allMyEntity$ | async">
        <my-entity [model]="item"></my-entity>
      </li>
    </ul>
  `,
  // styleUrls: ['./my-entity-list.component.scss'],
  styles: [`
    :host {
      display: block;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MyEntityComponent,
  ],
  //#endregion
})
export class MyEntityListComponent {
  myEntityApiService:MyEntityApiService = inject(MyEntityApiService);
  allMyEntity$ = this.myEntityApiService.allMyEntity$;
}
