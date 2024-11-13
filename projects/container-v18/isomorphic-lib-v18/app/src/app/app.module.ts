import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { TaonAdminModeConfigurationModule } from 'taon-ui'; // <- this is to replace by taon
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
    // TaonAdminModeConfigurationModule,
    //<<<TO_REPLACE_MODULE>>>
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
