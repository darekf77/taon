import { Component } from '@angular/core';
import { FieldArrayType, FormlyFormBuilder } from '@ngx-formly/core';

/*

DON'T FORGET
...
 FormlyModule.forRoot({
      types: [
        { name: 'repeat', component: RepeatTypeComponent },
      ],
    }),
...

*/


@Component({
  selector: 'formly-repeat-section',
  template: `
    <div  *ngIf="field.fieldGroup && field.fieldGroup.length === 0" >
      Press button below to add new element...
    </div>
    <div *ngFor="let field of field.fieldGroup; let i = index;" class="morphi-formly-array"  >
      <formly-group
        [model]="model[i]"
        [field]="field"
        [options]="options"
        [form]="formControl">
        <div>
          <button class="btn btn-danger" type="button" (click)="remove(i)">Remove</button>
        </div>
      </formly-group>
    </div>
    <div>
      <button class="btn btn-primary" type="button" (click)="add()">{{ field.fieldArray.templateOptions.label }}</button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 5px;
        margin-bottom: 5px;
        border: 1px solid gray;
      }

      formly-group {
        display: block;
        border: 1px dashed gray;
        margin-bottom: 5px;
        padding: 5px;
      }

      .morphi-formly-array {
        padding: 5px;
        background: white;
      }

    `
  ]
})
export class RepeatTypeComponent extends FieldArrayType {
  constructor(builder: FormlyFormBuilder) {
    super(builder);
  }
}
