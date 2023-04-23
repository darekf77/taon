
import { IsomorphicLibV3Module } from './isomorphic-lib-v3/app';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    //bundleOnly ServiceWorkerModule.register('ngsw-worker.js', {
      //bundleOnlyenabled: true,
      //bundleOnly// Register the ServiceWorker as soon as the app is stable
      //bundleOnly// or after 30 seconds (whichever comes first).
      //bundleOnlyregistrationStrategy: 'registerWhenStable:30000'
    //bundleOnly}),
    BrowserAnimationsModule,
    IsomorphicLibV3Module,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
