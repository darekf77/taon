import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';

@Component({
  selector: 'formly-horizontal-wrapper',
  template: `
    <div class="form-group row">
      <label
        [attr.for]="id"
        class="col-sm-2 col-form-label"
        *ngIf="to.label">
        {{ to.label }}
        <ng-container *ngIf="to.required && to.hideRequiredMarker !== true"
          >*</ng-container
        >
      </label>
      <div class="col-sm-10">
        <ng-template #fieldComponent></ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 5px;
        margin-bottom: 5px;
        border: 1px dotted gray;
      }
    `,
  ],
})
export class FormlyHorizontalWrapper extends FieldWrapper {
  @ViewChild('fieldComponent', { read: ViewContainerRef }) // @ts-ignore
  fieldComponent: ViewContainerRef;
}
