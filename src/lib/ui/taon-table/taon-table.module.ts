//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { TaonTableComponent } from './taon-table.component';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { StaticColumnsModule } from 'static-columns/src';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatButtonModule } from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,
    MatSelectModule,
    MtxGridModule,
    MatFormFieldModule,
    MatInputModule,
    StaticColumnsModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [TaonTableComponent],
  declarations: [TaonTableComponent],
})
export class TaonTableModule {}
//#endregion