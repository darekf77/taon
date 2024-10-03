//#region imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyEntityContainer } from './my-entity.container';
//#endregion

const routes: Routes = [
  //#region routes
  {
    path: '',
    component: MyEntityContainer,
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
  //#region container module options
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  declarations: [MyEntityContainer],
  //#endregion
})
export class MyEntityContainerModule { }

