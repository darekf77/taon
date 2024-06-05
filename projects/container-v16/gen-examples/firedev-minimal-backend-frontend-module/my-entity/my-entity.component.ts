//#region imports
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevFullMaterialModule } from 'firedev-ui';
import { StaticColumnsModule } from 'static-columns';
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
  template: `
    <p>
      my-entity works!
      <ng-container *ngIf="model">
        {{ model.description }}
      </ng-container>
    </p>
  `,
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
  //#region fileds & getters & inputs & output
  @Input() model: MyEntity;
  private api: typeof MyEntity = MyEntity;
  @Input() set MyEntity(myEntity: typeof MyEntity) {
    this.api = myEntity ? myEntity : this.api;
  }
  //#endregion

  //#region hooks
  ngOnInit() {

  }
  //#endregion
}
