//#region @browser
import { Injector, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevAdminModeConfigurationComponent } from './firedev-admin-mode-configuration.component';
import { FiredevFullMaterialModule } from '../firedev-full-material.module';
import { StaticColumnsModule } from 'static-columns/src';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FiredevAdminEditModeModule } from './components/firedev-admin-edit-mode';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { FiredevProgressBarModule } from '../firedev-progress-bar';
import { FiredevNotificationsModule } from '../firedev-notifications';
import { createCustomElement } from '@angular/elements';
import { FiredevDbAdminComponent } from './components/firedev-db-admin/firedev-db-admin.component';
import { FiredevSessionPasscodeComponent } from '../firedev-session-passcode';

@NgModule({
  imports: [
    CommonModule,
    StaticColumnsModule,
    FormsModule,
    NgScrollbarModule,
    FiredevAdminEditModeModule,
    FiredevProgressBarModule,
    FiredevNotificationsModule,
    FiredevFullMaterialModule, // TODO import only partial things
    FiredevDbAdminComponent,
    FiredevSessionPasscodeComponent,
  ],
  declarations: [FiredevAdminModeConfigurationComponent],
  exports: [FiredevAdminModeConfigurationComponent],
})
export class FiredevAdminModeConfigurationModule {}
//#endregion
