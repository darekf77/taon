//#region @browser
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevFullMaterialModule } from 'firedev-ui';
import { StaticColumnsModule } from 'static-columns';
import { MyEntityHelpers } from './my-entity.helpers';
import { MyEntity } from './my-entity';

@Component({
  selector: 'my-entity',
  templateUrl: './my-entity.component.html',
  styleUrls: ['./my-entity.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    // FiredevFullMaterialModule,
    // StaticColumnsModule,
  ],
})
export class MyEntityComponent {
  @Input() myEntity: MyEntity;
  ngOnInit() {
    MyEntityHelpers.helloWorldMyEntity();
  }

}
//#endregion
