//#region imports
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntity } from './my-entity';
//#endregion

@Component({
  //#region component data
  selector: 'my-entity',
  // templateUrl: './my-entity.component.html',
  template: `
    <p>
      my-entity ( description: {{ model?.description }} )
    </p>
  `,
  // styleUrls: ['./my-entity.component.scss'],
  styles: [`
    :host {
      display: block;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    // FiredevFullMaterialModule,
    // StaticColumnsModule,
  ],
  //#endregion
})
export class MyEntityComponent {
  @Input() model: MyEntity;
}
