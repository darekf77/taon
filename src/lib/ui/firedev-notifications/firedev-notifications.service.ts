//#region @browser
import { _ } from 'tnp-core/src';
import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import {
  FiredevNotificationOptions,
  FiredevNotificationType,
} from './firedev-notifications.models';

@Injectable({
  providedIn: 'root',
})
export class FiredevNotificationsService {
  constructor(private toast: HotToastService) {}

  private options(
    type: FiredevNotificationType,
    options: FiredevNotificationOptions | string
  ): FiredevNotificationOptions {
    if (_.isString(options)) {
      options = {
        // @ts-ignore
        title: options,
      };
    }
    return options as FiredevNotificationOptions;
  }

  success(options: FiredevNotificationOptions | string) {
    const opt = this.options('success', options);
    return this.toast.success(opt.title);
  }

  error(options: FiredevNotificationOptions | string) {
    const opt = this.options('error', options);
    return this.toast.error(opt.title);
  }

  warn(options: FiredevNotificationOptions | string) {
    const opt = this.options('warning', options);
    return this.toast.warning(opt.title);
  }

  info(options: FiredevNotificationOptions | string) {
    const opt = this.options('info', options);
    return this.toast.info(opt.title);
  }
}
//#endregion
