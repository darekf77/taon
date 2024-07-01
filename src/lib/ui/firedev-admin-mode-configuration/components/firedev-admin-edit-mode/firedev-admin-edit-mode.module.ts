//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevAdminEditModeComponent } from './firedev-admin-edit-mode.component';
import { FiredevFileComponent } from '../../../firedev-file';
import { FiredevFullMaterialModule } from '../../../firedev-full-material.module';
import { StaticColumnsModule } from 'static-columns/src';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgArrayPipesModule } from 'ngx-pipes';
import { FiredevFileGeneralOptModule } from '../firedev-file-general-opt';
import { FiredevTableModule } from '../../../firedev-table';

@NgModule({
  imports: [
    CommonModule,
    StaticColumnsModule,
    NgScrollbarModule,
    FiredevFileGeneralOptModule,
    FormsModule,
    FiredevFileComponent,
    NgArrayPipesModule,
    FiredevTableModule,
    FiredevFullMaterialModule, // TODO import only partial things
  ],
  declarations: [FiredevAdminEditModeComponent],
  exports: [FiredevAdminEditModeComponent],
})
export class FiredevAdminEditModeModule {}
//#endregion
