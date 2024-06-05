import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    //<<<TO_REPLACE_MODULE>>>
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
