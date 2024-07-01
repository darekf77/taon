//#region @browser
import { HotToastService } from '@ngneat/hot-toast';

export class FiredevNotificationOptions {
  title: string;
  subtitle?: string;
}

export type FiredevNotificationType = keyof Omit<
  HotToastService,
  'defaultConfig' | 'observe'
>;
//#endregion
