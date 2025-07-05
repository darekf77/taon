// import { environment } from './environments/environment';
// import { enableProdMode } from '@angular/core';
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { AppModule } from './app/app.module';
// import { loadSqlJs } from './sqljs-loader';

// if (environment.production) {
//   enableProdMode();
// }

// async function init() {
//   await loadSqlJs();
//   platformBrowserDynamic()
//     .bootstrapModule(AppModule)
//     .catch(err => console.error(err));
// }

// init();

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
