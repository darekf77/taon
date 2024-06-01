import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { FiredevAdminModeConfigurationModule } from 'firedev-ui'; // <- this is to replace by firedev

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    //distReleaseOnly ServiceWorkerModule.register('ngsw-worker.js', {
      //distReleaseOnlyenabled: true,
      //distReleaseOnly// Register the ServiceWorker as soon as the app is stable
      //distReleaseOnly// or after 30 seconds (whichever comes first).
      //distReleaseOnlyregistrationStrategy: 'registerWhenStable:30000'
    //distReleaseOnly}),
    BrowserAnimationsModule,
    // FiredevAdminModeConfigurationModule,
    //<<<TO_REPLACE_MODULE>>>
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
