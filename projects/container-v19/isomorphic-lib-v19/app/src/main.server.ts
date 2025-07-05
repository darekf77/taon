// (globalThis as any).window = undefined;
// (globalThis as any).document = undefined;
// import { environment } from './environments/environment';

// import { enableProdMode } from '@angular/core';
// import { renderModule } from '@angular/platform-server';

// import { AppServerModule } from './app/app.server.module';

// if (environment.production) {
//   enableProdMode();
// }

// export default function render(url: string, document: string) {
//   return renderModule(AppServerModule, {
//     document,
//     url,
//   });
// }

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
