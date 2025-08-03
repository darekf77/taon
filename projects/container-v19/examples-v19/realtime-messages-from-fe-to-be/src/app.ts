//#region imports
import { CommonModule } from '@angular/common';// @browser
import { Component, NgModule } from '@angular/core'; // @browser
import { Taon, BaseContext } from 'taon/src';

import {
  HOST_CONFIG,
} from './app.hosts';
//#endregion

//#region constants
const eventsKey = 'eventsKey';
//#endregion

//#region realtime-subscribers component
//#region @browser
@Component({
  standalone: false,
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
