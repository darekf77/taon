//#region imports
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MyEntityContainer } from './my-entity.container';
import { routesMyEntity } from './my-entity.routes';
//#endregion

@NgModule({
  //#region module options
  imports: [
    CommonModule,
    RouterModule.forChild(routesMyEntity),
  ],
  declarations: [MyEntityContainer],
  //#endregion
})
export class MyEntityModule { }

