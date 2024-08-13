//#region imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FiredevCmsContainer } from './firedev-cms.container';
//#endregion

const routes: Routes = [
  //#region routes
  {
    path: '',
    component: FiredevCmsContainer,
    // redirectTo: './list',
    pathMatch: 'full', // => when using variables in other routers
  },
  {
    path: 'list',
    loadChildren: () =>
      import('./firedev-cms-list/firedev-cms-list.container.module').then(
        m => m.FiredevCmsListContainerModule
      ),
  },
  // {
  //   path: 'other/:otherId',
  //   loadChildren: () => import('othermodule')
  //     .then(m => m.OtherLazyModule),
  // },
  //#endregion
];

@NgModule({
  //#region container module options
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [FiredevCmsContainer],
  //#endregion
})
export class FiredevCmsContainerModule {}
