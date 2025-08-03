//#region imports
import { Taon, BaseContext } from 'taon/src';
import { Observable, map, scan } from 'rxjs';
import {
  CLIENT_DEV_NORMAL_APP_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  HOST_BACKEND_PORT,
  HOST_CONFIG,
} from './app.hosts';
import { Helpers } from 'tnp-core/src';
//#region @browser
import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

//#region constants

const eventsKey = 'eventsKey';
//#endregion

//#region realtime-subscribers component
//#region @browser
@Component({
  template: `hello from realtime messages<br />
    <br />
    messages from backend
    <ul>
      <li *ngFor="let message of messages$ | async">{{ message }}</li>
    </ul> `,
  standalone: false,
})
export class RealtimeMessagesFromBeToFeComponent {
  readonly messages$: Observable<string[]> =
    MainContext.__refSync.realtimeClient
      .listenChangesCustomEvent(eventsKey)
      .pipe(scan((acc, e) => [...acc, e], [])) as any as Observable<string[]>;
}
//#endregion
//#endregion

//#region  realtime-subscribers context
const MainContext = Taon.createContext(() => ({
  ...HOST_CONFIG['app.ts']['MainContext'],
  useIpcWhenElectron: true,
  contextName: 'MainContext',
  contexts: { BaseContext },
  controllers: {},
  entities: {},
  database: true,
  logs: {
    realtime: true,
  },
}));
//#endregion

//#region start
async function start() {
  await MainContext.initialize();

  //#region @websql
  let counter = 0;
  const notifyBrowser = () => {
    MainContext.__refSync.realtimeServer.triggerCustomEvent(
      eventsKey,
      'hello message from backend no: ' + counter++,
    );
    console.log('notified browser');
    setTimeout(notifyBrowser, 1000);
  };
  notifyBrowser();
  //#endregion
}

export default start;
//#endregion

//#region  realtime-messages-from-be-to-fe module
//#region @browser
@NgModule({
  declarations: [RealtimeMessagesFromBeToFeComponent],
  imports: [CommonModule],
  exports: [RealtimeMessagesFromBeToFeComponent],
})
export class RealtimeMessagesFromBeToFeModule {}
//#endregion
//#endregion
