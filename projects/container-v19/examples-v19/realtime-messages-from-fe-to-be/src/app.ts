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
  template: `push global event to backend with click of a button<br />
    <br />
    <button (click)="notifyBackend()">notify backend</button> `,
})
export class RealtimeMessagesFromFeToBeComponent {
  counter = 0;
  notifyBackend() {
    console.log('notifyBackend');
    MainContext.__refSync.realtimeClient.triggerCustomEvent(
      eventsKey,
      `hello ${++this.counter} message from frontend`,
    );
  }
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
  console.log(`Server subscribed to events ${eventsKey}`);
  MainContext.__refSync.realtimeServer
    .listenChangesCustomEvent(eventsKey)
    .subscribe(data => {
      // TODO @LAST fix this for electron
      console.log('data from frontend:', data);
    });
  //#endregion
}

export default start;
//#endregion

//#region  realtime-messages-from-fe-to-be module
//#region @browser
@NgModule({
  declarations: [RealtimeMessagesFromFeToBeComponent],
  imports: [CommonModule],
  exports: [RealtimeMessagesFromFeToBeComponent],
})
export class RealtimeMessagesFromFeToBeModule {}
//#endregion
//#endregion
