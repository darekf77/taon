//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaonAdminEditModeComponent } from './taon-admin-edit-mode.component';
// import { TaonFileComponent } from '../../../taon-file';
import { TaonFullMaterialModule } from '../../../taon-full-material.module';
import { StaticColumnsModule } from 'static-columns/src';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { NgArrayPipesModule } from 'ngx-pipes';
import { TaonFileGeneralOptModule } from '../taon-file-general-opt';
import { TaonTableModule } from '../../../taon-table';

@NgModule({
  imports: [
    CommonModule,
    StaticColumnsModule,
    NgScrollbarModule,
    TaonFileGeneralOptModule,
    FormsModule,
    // TaonFileComponent,
    NgArrayPipesModule,
    TaonTableModule,
    TaonFullMaterialModule, // TODO import only partial things
  ],
  declarations: [TaonAdminEditModeComponent],
  exports: [TaonAdminEditModeComponent],
})
export class TaonAdminEditModeModule {}
//#endregion
