import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeModComponent } from './home-mod.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomeModComponent,

      }
    ])
  ],
  declarations: [HomeModComponent]
})
export class HomeModModule { }
