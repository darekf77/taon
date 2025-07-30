//#region imports
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppContainer } from './app.container';
//#endregion

export const routesApp: Routes = [
  //#region routers
  {
    path: '',
    component: AppContainer,
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
  //#endregion
];