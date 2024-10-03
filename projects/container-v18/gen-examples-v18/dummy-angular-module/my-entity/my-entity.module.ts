import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyEntityComponent } from './my-entity.component';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [MyEntityComponent],
  exports: [MyEntityComponent],
})
export class MyEntityModule { }

