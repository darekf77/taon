//#region imports
import { Firedev, BaseContext } from 'firedev/src';
import { Observable, map } from 'rxjs';
import { HOST_BACKEND_PORT } from './app.hosts';
//#region @browser
import { NgModule, inject, Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

console.log('hello world');
console.log('Your server will start on port ' + HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;

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
  userControlller = Firedev.inject(() => MainContext.get(UserController));
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
  host,
  frontendHost: 'http://localhost:5555',
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

async function start() {
  await MainContext.initialize();

  const eventsKey = 'eventsKey';

  //#region @browser
  MainContext.refSync.realtimeClient
    .listenChangesCustomEvent(eventsKey)
    .subscribe(event => {
      console.log('socket form backend ', event);
    });
  //#endregion

  //#region @websql
  const notifyUser = ()=> {
    MainContext.refSync.realtimeServer.triggerCustomEvent(eventsKey,'hello from backend');
    setTimeout(notifyUser, 4000 );
  };
  notifyUser();
  //#endregion

  if (Firedev.isBrowser) {
    const ref = await MainContext.ref();
    const users = (await ref.getInstanceBy(UserController).getAll().received)
      .body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;
