//#region @browser
import { Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { MyEntityComponent } from './my-entity.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'formly-field-my-entity',
  template: `
    <my-entity [model]="model" ></my-entity>
    <!-- <input type="input" [formControl]="formControl" [formlyAttributes]="field"> -->
  `,
  standalone: true,
  imports: [MyEntityComponent, CommonModule],
})
export class MyEntityFormlyField extends FieldType<FieldTypeConfig> {
  ngOnInit() {
  }
}
//#endregion
