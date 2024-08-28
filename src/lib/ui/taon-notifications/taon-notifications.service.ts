//#region @browser
import { _ } from 'tnp-core/src';
import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import {
  TaonNotificationOptions,
  TaonNotificationType,
} from './taon-notifications.models';

@Injectable({
  providedIn: 'root',
})
export class TaonNotificationsService {
  constructor(private toast: HotToastService) {}

  private options(
    type: TaonNotificationType,
    options: TaonNotificationOptions | string
  ): TaonNotificationOptions {
    if (_.isString(options)) {
      options = {
        // @ts-ignore
        title: options,
      };
    }
    return options as TaonNotificationOptions;
  }

  success(options: TaonNotificationOptions | string) {
    const opt = this.options('success', options);
    return this.toast.success(opt.title);
  }

  error(options: TaonNotificationOptions | string) {
    const opt = this.options('error', options);
    return this.toast.error(opt.title);
  }

  warn(options: TaonNotificationOptions | string) {
    const opt = this.options('warning', options);
    return this.toast.warning(opt.title);
  }

  info(options: TaonNotificationOptions | string) {
    const opt = this.options('info', options);
    return this.toast.info(opt.title);
  }
}
//#endregion
