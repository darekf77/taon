import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMainPageComponent } from './main-page.component';
import { FormsModule } from '@angular/forms';

import { MyLibModule } from 'angular-lib';
import { Routes, RouterModule } from '@angular/router';


export const routes: Routes = [
  {
      path: '',
      pathMatch: 'prefix',
      component: AppMainPageComponent
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MyLibModule.forRoot()
  ],
  declarations: [AppMainPageComponent]
})
export class AppMainPageModule { }
