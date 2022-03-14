import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

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
    //<<<TO_REPLACE_MODULE>>>
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
