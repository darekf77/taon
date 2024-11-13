//#region @browser
import { Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaonAdminModeConfigurationComponent } from './taon-admin-mode-configuration.component';
import { TaonFullMaterialModule } from '../taon-full-material.module';
import { StaticColumnsModule } from 'static-columns/src';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TaonAdminEditModeModule } from './components/taon-admin-edit-mode';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TaonProgressBarModule } from '../taon-progress-bar';
import { TaonNotificationsModule } from '../taon-notifications';
import { createCustomElement } from '@angular/elements';
// import { TaonDbAdminComponent } from './components/taon-db-admin/taon-db-admin.component';
import { TaonSessionPasscodeComponent } from '../taon-session-passcode';

@NgModule({
  imports: [
    CommonModule,
    StaticColumnsModule,
    FormsModule,
    NgScrollbarModule,
    TaonAdminEditModeModule,
    TaonProgressBarModule,
    TaonNotificationsModule,
    TaonFullMaterialModule, // TODO import only partial things
    // TaonDbAdminComponent,
    TaonSessionPasscodeComponent,
  ],
  declarations: [TaonAdminModeConfigurationComponent],
  exports: [TaonAdminModeConfigurationComponent],
})
export class TaonAdminModeConfigurationModule {}
//#endregion
