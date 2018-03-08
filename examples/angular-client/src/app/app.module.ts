// angular
import { RouterModule, Route, PreloadAllModules } from "@angular/router";
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// thrid part
import * as _ from 'lodash';
import { init, replay, AngularProviders } from 'morphi/browser';
// my modules
// import { MyLibModule } from 'angular-lib';
import { Controllers, Entities } from 'isomorphic-lib/browser';
// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from "./app.routes";

init('http://localhost:4000')
  .angularProviders({
    controllers: _.values(Controllers),
    entities: _.values(Entities)
  })

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    // MyLibModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: false, preloadingStrategy: PreloadAllModules })
  ],
  providers: [
    AngularProviders
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
