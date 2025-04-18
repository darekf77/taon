//#region imports
import { Taon, BaseContext } from 'taon/src';
import { Observable, map, scan } from 'rxjs';
import {
  CLIENT_DEV_NORMAL_APP_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  HOST_BACKEND_PORT,
} from './app.hosts';
import { Helpers } from 'tnp-core/src';
//#region @browser
import { Component, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

//#region constants
const host1 = 'http://localhost:' + HOST_BACKEND_PORT;
const frontendHost1 =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);
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
  host: host1,
  useIpcWhenElectron: true,
  frontendHost: frontendHost1,
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
