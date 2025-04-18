//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaonProgressBarComponent } from './taon-progress-bar.component';
// import { NgProgressConfig, NgProgressModule } from 'ngx-progressbar';

@NgModule({
  imports: [CommonModule,
    // NgProgressModule.withConfig({})
  ],
  declarations: [TaonProgressBarComponent],
  exports: [TaonProgressBarComponent],
})
export class TaonProgressBarModule {}
//#endregion
