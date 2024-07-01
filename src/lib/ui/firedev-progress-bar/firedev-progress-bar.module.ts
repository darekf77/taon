//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevProgressBarComponent } from './firedev-progress-bar.component';
import { NgProgressConfig, NgProgressModule } from 'ngx-progressbar';

@NgModule({
  imports: [CommonModule, NgProgressModule.withConfig({})],
  declarations: [FiredevProgressBarComponent],
  exports: [FiredevProgressBarComponent],
})
export class FiredevProgressBarModule {}
//#endregion
