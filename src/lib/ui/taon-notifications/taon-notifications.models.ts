//#region @browser
import { HotToastService } from '@ngneat/hot-toast';

export class TaonNotificationOptions {
  title: string;
  subtitle?: string;
}

export type TaonNotificationType = keyof Omit<
  HotToastService,
  'defaultConfig' | 'observe'
>;
//#endregion
