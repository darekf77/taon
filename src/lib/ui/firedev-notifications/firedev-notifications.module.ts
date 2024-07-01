//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevNotificationsComponent } from './firedev-notifications.component';

import { HotToastModule } from '@ngneat/hot-toast';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FiredevNotificationsService } from './firedev-notifications.service';

@NgModule({
  imports: [
    // CommonModule,
    // BrowserAnimationsModule, // required animations module
    HotToastModule.forRoot({
      position: 'top-right',
    }),
  ],
  exports: [FiredevNotificationsComponent],
  declarations: [FiredevNotificationsComponent],
  providers: [FiredevNotificationsService],
})
export class FiredevNotificationsModule {}
//#endregion
