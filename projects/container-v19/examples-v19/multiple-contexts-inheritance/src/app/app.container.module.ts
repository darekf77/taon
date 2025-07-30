//#region imports
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppContainer } from './app.container';
//#endregion

const routes: Routes = [
  //#region routes
  {
    path: '',
    component: AppContainer,
    // pathMatch: 'full' // => when using variables in other routers
  },
  // {
  //   path: 'anothermodulepath',
  //   loadChildren: () => import('anothermodule')
  //     .then(m => m.AnotherLazyModule),
  // },
  // {
  //   path: 'other/:otherId',
  //   loadChildren: () => import('othermodule')
  //     .then(m => m.OtherLazyModule),
  // },
  //#endregion
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  declarations: [AppContainer],
})
export class AppContainerModule { }