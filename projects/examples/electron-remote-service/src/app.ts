//#region @notForNpm
//#region imports
import { Firedev } from 'firedev/src';
import { Observable, map } from 'rxjs';
import { HOST_BACKEND_PORT } from './app.hosts';
import { Helpers } from 'tnp-helpers/src';
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

//#region @browser
//#region component
@Component({
  selector: 'app-electron-remote-service',
  template: `hello from electron-remote-service<br>
    <br>
    users from backend
    <ul>
      <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
    </ul>
  `,
  styles: [` body { margin: 0px !important; } `],
})
export class ElectronRemoteServiceComponent implements OnInit {
  users$: Observable<User[]> = User.ctrl.getAll().received.observable
    .pipe(map(data => data.body.json));

  constructor() { }
  ngOnInit() { }
}
//#endregion

//#region module
@NgModule({
  imports: [CommonModule],
  exports: [ElectronRemoteServiceComponent],
  declarations: [ElectronRemoteServiceComponent],
  providers: [],
})
export class ElectronRemoteServiceModule { }
//#endregion

//#endregion

//#region user entity
@Firedev.Entity({ className: 'User' })
class User extends Firedev.Base.Entity {
  public static ctrl = Firedev.inject(() => UserContext.types.controllers.UserController);
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id?: string | number;
}
//#endregion

//#region user controller
@Firedev.Controller({ className: 'UserController' })
class UserController extends Firedev.Base.CrudController<User> {
  entity = () => UserContext.types.entities.User;

  //#region @websql
  async initExampleDbData(): Promise<void> {
    const userToSave = new UserContext.types.entities.User();
    await this.repository.save(userToSave);
  }
  //#endregion
}
//#endregion

//#region user context
const UserContext = Firedev.createContext({
  contextName: 'UserContext',
  host: 'http://localhost:' + HOST_BACKEND_PORT,
  controllers: {
    UserController,
  },
  entities: {
    User,
  },
  repositories: {
    [Firedev.Base.Repository.name]: Firedev.Base.Repository
  },
  database: true,
});
//#endregion

async function start() {
  await Helpers.killProcessByPort(HOST_BACKEND_PORT);
  await Helpers.killProcessByPort(HOST_BACKEND_PORT + 1);

  await UserContext.initialize();
  // if (Firedev.isBrowser) {
  //   console.log('User.ctrl', User.ctrl);
  //   const response = await User.ctrl.getAll().received;
  //   const users = response?.body?.json;
  //   console.log({
  //     'users from backend': users
  //   })
  // }
}

export default start;
//#endregion
