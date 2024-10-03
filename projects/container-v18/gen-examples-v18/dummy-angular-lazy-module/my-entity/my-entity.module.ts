//#region imports
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyEntityComponent } from './my-entity.component';
//#endregion

const routes: Routes = [
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

@NgModule({
  //#region module options
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  declarations: [MyEntityComponent],
  //#endregion
})
export class MyEntityModule { }

