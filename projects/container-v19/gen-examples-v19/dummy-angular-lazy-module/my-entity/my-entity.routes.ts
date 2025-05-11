//#region imports
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyEntityComponent } from './my-entity.component';
//#endregion

export const routesMyEntity: Routes = [
  //#region routers
  {
    path: '',
    component: MyEntityComponent,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
  //#endregion
];
