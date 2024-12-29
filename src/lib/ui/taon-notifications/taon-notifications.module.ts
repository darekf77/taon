//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaonNotificationsComponent } from './taon-notifications.component';

// import { HotToastModule } from '@ngneat/hot-toast';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TaonNotificationsService } from './taon-notifications.service';

@NgModule({
  imports: [
    // CommonModule,
    // BrowserAnimationsModule, // required animations module
    // HotToastModule.forRoot({
    //   position: 'top-right',
    // }),
  ],
  exports: [TaonNotificationsComponent],
  declarations: [TaonNotificationsComponent],
  providers: [TaonNotificationsService],
})
export class TaonNotificationsModule {}
//#endregion
