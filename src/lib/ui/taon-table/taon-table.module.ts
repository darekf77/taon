import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { StaticColumnsModule } from 'static-columns/src';

import { TaonTableComponent } from './taon-table.component';

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
