//#region imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FiredevCmsListContainer } from './firedev-cms-list.container';
import { FiredevTableModule } from '../../firedev-table';
import { StaticColumnsModule } from 'static-columns/src';
import { FiredevFullMaterialModule } from 'firedev-ui/src';
import { FiredevCmsEditComponent } from '../firedev-cms-edit';
//#endregion

const routes: Routes = [
  //#region routes
  {
    path: '',
    component: FiredevCmsListContainer,
    pathMatch: 'full', // => when using variables in other routers
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
    FiredevTableModule,
    StaticColumnsModule,
    FiredevFullMaterialModule,
    RouterModule.forChild(routes),
    FiredevCmsEditComponent,
  ],
  declarations: [FiredevCmsListContainer],
  //#endregion
})
export class FiredevCmsListContainerModule {}
