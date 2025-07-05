// (globalThis as any).window = undefined;
// (globalThis as any).document = undefined;

import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { AppServerComponent } from './app.component.server';

@NgModule({
  imports: [
    ServerModule,
  ],
  providers: [],
  bootstrap: [AppServerComponent],
})
export class AppServerModule {}
