//#region @browser
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { Subscription } from 'rxjs';
import type { FiredevFile } from '../../../firedev-file';
import { _ } from 'tnp-core/src';

@Component({
  selector: 'firedev-file-general-opt',
  templateUrl: './firedev-file-general-opt.component.html',
  styleUrls: ['./firedev-file-general-opt.component.scss'],
})
export class FiredevFileGeneralOptComponent implements OnInit {
  @HostBinding('style.minHeight.px') @Input() height: number = 100;
  handlers: Subscription[] = [];
  fieldsOrder = [];
  fields: FormlyFieldConfig[] = (
    [
      {
        key: 'width',
      },
      {
        key: 'height',
      },
      {
        key: 'display',
      },
      {
        key: 'widthUnit',
        // expressionProperties: {
        //   'templateOptions.disabled': (model: FiredevFileCss) => {
        //     return !_.isNumber(model.width)
        //   },
        // },
      },
      {
        key: 'heightUnit', // @ts-ignore
        // expressionProperties: {
        //   'templateOptions.disabled': (model: FiredevFileCss) => {
        //     return !_.isNumber(model.height)
        //   },
        // },
      },
      {
        key: 'action',
        type: 'action',
        templateOptions: {
          label: 'Reset',
          icon: 'cancel',
          raised: true,
          action: () => {
            console.log('reset');
          },
        },
      },
    ] as FormlyFieldConfig[]
  ).map(f => {
    f.className = 'formly-field-half-size';
    return f;
  });
  @Input() file: FiredevFile;

  constructor() {}

  ngOnInit() {}

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }
}
//#endregion
