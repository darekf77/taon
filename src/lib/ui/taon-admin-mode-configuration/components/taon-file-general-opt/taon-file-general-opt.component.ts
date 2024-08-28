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
import type { TaonFile } from '../../../taon-file';
import { _ } from 'tnp-core/src';

@Component({
  selector: 'taon-file-general-opt',
  templateUrl: './taon-file-general-opt.component.html',
  styleUrls: ['./taon-file-general-opt.component.scss'],
})
export class TaonFileGeneralOptComponent implements OnInit {
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
        //   'templateOptions.disabled': (model: TaonFileCss) => {
        //     return !_.isNumber(model.width)
        //   },
        // },
      },
      {
        key: 'heightUnit', // @ts-ignore
        // expressionProperties: {
        //   'templateOptions.disabled': (model: TaonFileCss) => {
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
  @Input() file: TaonFile;

  constructor() {}

  ngOnInit() {}

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }
}
//#endregion
