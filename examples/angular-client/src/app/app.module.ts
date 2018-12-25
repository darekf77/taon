// angular
import { RouterModule, Route, PreloadAllModules } from '@angular/router';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// thrid part
import * as _ from 'lodash';
import { Morphi } from 'morphi/browser';
// my modules
// import { MyLibModule } from 'angular-lib';
import { Controllers, Entities } from 'isomorphic-lib/browser';
// local
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { routes } from './app.routes';

Morphi.init({
  host: 'http://localhost:4000',
  controllers: Controllers,
  entities: Entities
});

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    // MyLibModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: true, preloadingStrategy: PreloadAllModules })
  ],
  providers: [
    Morphi.Providers
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
