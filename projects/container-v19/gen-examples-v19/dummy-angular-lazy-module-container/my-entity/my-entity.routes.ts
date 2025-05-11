//#region imports
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyEntityContainer } from './my-entity.container';
//#endregion

export const routesMyEntity: Routes = [
  //#region routers
  {
    path: '',
    component: MyEntityContainer,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
  //#endregion
];
