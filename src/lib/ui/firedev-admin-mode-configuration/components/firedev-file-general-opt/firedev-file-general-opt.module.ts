//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevFileGeneralOptComponent } from './firedev-file-general-opt.component';
import { FiredevFormlyFormModule } from '../../../firedev-formly/firedev-formly-form';
import { FiredevFullMaterialModule } from '../../../firedev-full-material.module';

@NgModule({
  imports: [CommonModule, FiredevFormlyFormModule, FiredevFullMaterialModule],
  declarations: [FiredevFileGeneralOptComponent],
  exports: [FiredevFileGeneralOptComponent],
})
export class FiredevFileGeneralOptModule {}
//#endregion
