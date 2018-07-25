
import { SYMBOL } from "./SYMBOLS";
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';


export function FormlyForm(fromFn: (from: FormlyFieldConfig[]) => FormlyFieldConfig[]) {
  return function (target: Function) {
    if (!target[SYMBOL.FORMLY_METADATA]) {
      target[SYMBOL.FORMLY_METADATA] = [];
    }
  }
}

export function getFromlyFrom(entity: Function) {

}


