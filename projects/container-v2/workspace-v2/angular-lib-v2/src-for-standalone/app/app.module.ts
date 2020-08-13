import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BaseModuleModule } from 'components';
import { AppComponent } from './app.component';
import { RouterModule, Route, PreloadAllModules } from '@angular/router';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    BaseModuleModule
    // RouterModule.forRoot(routes, {
    //   useHash: true,
    //   preloadingStrategy: PreloadAllModules,
    //   enableTracing: false
    // }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
