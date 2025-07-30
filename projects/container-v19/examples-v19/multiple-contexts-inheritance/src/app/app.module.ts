//#region imports
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TAON_CONTEXT } from 'taon/src';

import { AppContainer } from './app.container';
import { AppContext } from './app.context';
import { routesApp } from './app.routes';
//#endregion

@NgModule({
  //#region module options
  providers: [{
    provide: TAON_CONTEXT,
    useFactory: () => AppContext,
  }],
  imports: [
    CommonModule,
    RouterModule.forChild(routesApp),
  ],
  declarations: [AppContainer],
  //#endregion
})
export class AppModule { }