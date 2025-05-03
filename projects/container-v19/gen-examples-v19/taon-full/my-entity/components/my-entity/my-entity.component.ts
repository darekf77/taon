//#region imports
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntity } from '../../my-entity';
//#endregion

@Component({
  selector: 'my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
  ],
})
export class MyEntityComponent {
  @Input() model: MyEntity;
}
