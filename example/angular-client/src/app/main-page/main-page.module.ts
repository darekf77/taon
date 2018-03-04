import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppMainPageComponent } from './main-page.component';
import { FormsModule } from '@angular/forms';
import { AccordionModule, ModalModule } from "ngx-bootstrap";

import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from '../login/login.component';


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
    AccordionModule.forRoot(),
    ModalModule.forRoot()
  ],
  declarations: [AppMainPageComponent, LoginComponent],
  exports: [LoginComponent]
})
export class AppMainPageModule { }
