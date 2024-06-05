//#region imports
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevFullMaterialModule } from 'firedev-ui';
import { StaticColumnsModule } from 'static-columns';
import { MyEntityHelpers } from './my-entity.helpers';
import { MyEntity } from './my-entity';
//#endregion

/**
 * MyEntity angular standalone component
 *
 * + component for entity can be dummy or with backend
 * + use this.api.getAllOrWhatever() to access backend => not MyEntity.getAllOrWhatever()
 */
@Component({
  //#region component data
  selector: 'my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    // FiredevFullMaterialModule,
    // StaticColumnsModule,
  ],
  //#endregion
})
export class MyEntityComponent {
  //#region fileds & getters & inputs & output
  @Input() model: MyEntity;
  private api: typeof MyEntity = MyEntity;
  @Input() set MyEntity(myEntity: typeof MyEntity) {
    this.api = myEntity ? myEntity : this.api;
  }
  //#endregion

  //#region hooks
  ngOnInit() {
    MyEntityHelpers.helloWorldMyEntity();
  }
  //#endregion

}
