import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteModuleComponent } from './route-module.component';
import { RouterModule } from '@angular/router';
// console.log('TestUiModModule', TestUiModModule)

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: RouteModuleComponent,
      }
    ])
  ],
  declarations: [RouteModuleComponent]
})
export class RouteModuleModule { }
