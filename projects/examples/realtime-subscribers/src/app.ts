//#region imports
import { Firedev, BaseContext } from 'firedev/src';
import { Observable, map } from 'rxjs';
import {
  CLIENT_DEV_NORMAL_APP_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  HOST_BACKEND_PORT,
} from './app.hosts';
import { Helpers } from 'tnp-core/src';
//#region @browser
import { NgModule, inject, Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

console.log('hello world');
console.log('Your server will start on port ' + HOST_BACKEND_PORT);
const host1 = 'http://localhost:' + HOST_BACKEND_PORT;
const host2 = 'http://localhost:' + (HOST_BACKEND_PORT + 1);
const frontendHost1 =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);
const frontendHost2 =
  'http://localhost:' +
  ((Helpers.isWebSQL
    ? CLIENT_DEV_WEBSQL_APP_PORT
    : CLIENT_DEV_NORMAL_APP_PORT) +
    1);

console.log({ host1, host2, frontendHost1, frontendHost2 });

//#region realtime-subscribers component
//#region @browser
@Component({
  selector: 'app-realtime-subscribers',
  template: `hello from realtime-subscribers<br />
    <br />
    users from backend
    <ul>
      <li *ngFor="let user of users$ | async">{{ user | json }}</li>
    </ul> `,
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class RealtimeSubscribersComponent {
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
}
//#endregion
//#endregion

//#region  realtime-subscribers api service
//#region @browser
@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  userControlller = Firedev.inject(() => MainContext.getClass(UserController));
  getAll() {
    return this.userControlller
      .getAll()
      .received.observable.pipe(map(r => r.body.json));
  }
}
//#endregion
//#endregion

//#region  realtime-subscribers module
//#region @browser
@NgModule({
  exports: [RealtimeSubscribersComponent],
  imports: [CommonModule],
  declarations: [RealtimeSubscribersComponent],
})
export class RealtimeSubscribersModule {}
//#endregion
//#endregion

//#region  realtime-subscribers entity
@Firedev.Entity({ className: 'User' })
class User extends Firedev.Base.AbstractEntity {
  public static ctrl?: UserController;
  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  name?: string;
}
//#endregion

//#region  realtime-subscribers controller
@Firedev.Controller({ className: 'UserController' })
class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = () => User;
  //#region @websql
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  //#endregion
}
//#endregion

//#region  realtime-subscribers context
const MainContext = Firedev.createContext(() => ({
  host: host1,
  useIpcWhenElectron: true,
  frontendHost: frontendHost1,
  contextName: 'MainContext',
  contexts: { BaseContext },
  controllers: {
    UserController,
    // PUT FIREDEV CONTORLLERS HERE
  },
  entities: {
    User,
    // PUT FIREDEV ENTITIES HERE
  },
  database: true,
}));
//#endregion

//#region  realtime-subscribers context
// const MainContext2 = Firedev.createContext(() => ({
//   host: host2,
//   useIpcWhenElectron: true,
//   frontendHost: frontendHost1,
//   contextName: 'MainContext2',
//   contexts: { BaseContext },
//   controllers: {
//     UserController,
//     // PUT FIREDEV CONTORLLERS HERE
//   },
//   entities: {
//     User,
//     // PUT FIREDEV ENTITIES HERE
//   },
//   database: true,
// }));
//#endregion

async function start() {
  await MainContext.initialize();
  // await MainContext2.initialize();

  const eventsKey = 'eventsKey';
  (() => {
    //#region @browser
    MainContext.__refSync.realtimeClient
      .listenChangesCustomEvent(eventsKey)
      .subscribe(event => {
        console.log('socket form backend111 ', event);
      });

    // MainContext2.refSync.realtimeClient
    //   .listenChangesCustomEvent(eventsKey)
    //   .subscribe(event => {
    //     console.log('socket form backen222 ', event);
    //   });
    //#endregion
  })();

  //#region @websql
  const notifyUser = () => {
    MainContext.__refSync.realtimeServer.triggerCustomEvent(
      eventsKey,
      'hello from backend111',
    );
    // MainContext2.refSync.realtimeServer.triggerCustomEvent(
    //   eventsKey,
    //   'hello from backend222',
    // );
    setTimeout(notifyUser, 4000);
  };
  notifyUser();
  //#endregion

  if (Firedev.isBrowser) {

    const users = (await MainContext.getClassInstance(UserController).getAll().received)
      .body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;

