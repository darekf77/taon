//#region imports
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntity } from './my-entity';
//#endregion

@Component({
  //#region component data
  selector: 'my-entity',
  // templateUrl: './my-entity.component.html',
  template: ` <p>my-entity ( description: {{ model?.description }} )</p> `,
  // styleUrls: ['./my-entity.component.scss'],
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    // TaonFullMaterialModule,
    // StaticColumnsModule,
  ],
  //#endregion
})
export class MyEntityComponent {
  @Input() model: MyEntity;
}
