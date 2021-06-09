import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeModComponent } from './home-mod.component';
import { RouterModule } from '@angular/router';

import { start } from 'isomorphic-lib-v2/src/app';


start()

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
