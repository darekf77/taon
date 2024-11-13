//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaonFileGeneralOptComponent } from './taon-file-general-opt.component';
import { TaonFullMaterialModule } from '../../../taon-full-material.module';

@NgModule({
  imports: [CommonModule, TaonFullMaterialModule],
  declarations: [TaonFileGeneralOptComponent],
  exports: [TaonFileGeneralOptComponent],
})
export class TaonFileGeneralOptModule {}
//#endregion
