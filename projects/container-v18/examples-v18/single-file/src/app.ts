//#region imports
import { Firedev, BaseContext } from 'firedev/src';
import { Observable, map } from 'rxjs';
import { HOST_BACKEND_PORT } from './app.hosts';
//#region @browser
import { NgModule, inject, Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VERSION } from '@angular/core';
//#endregion
//#endregion

console.log('hello world');
console.log('Your server will start on port '+ HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;

//#region isomorphic-lib component
//#region @browser
@Component({
  selector: 'app-isomorphic-lib',
  template: `hello from isomorphic-lib<br>
    Angular version: {{ angularVersion }}<br>
    <br>
    users from backend
    <ul>
      <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
    </ul>
  `,
  styles: [` body { margin: 0px !important; } `],
})
export class IsomorphicLibComponent {
  angularVersion = VERSION.full;
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
}
//#endregion
//#endregion

//#region  isomorphic-lib api service
//#region @browser
@Injectable({
  providedIn:'root'
})
export class UserApiService {
  userControlller = Firedev.inject(()=> MainContext.getClass(UserController))
  getAll() {
    return this.userControlller.getAll()
      .received
      .observable
      .pipe(map(r => r.body.json));
  }
}
//#endregion
//#endregion

//#region  isomorphic-lib module
//#region @browser
@NgModule({
  exports: [IsomorphicLibComponent],
  imports: [CommonModule],
  declarations: [IsomorphicLibComponent],
})
export class IsomorphicLibModule { }
//#endregion
//#endregion

//#region  isomorphic-lib entity
@Firedev.Entity({ className: 'User' })
class User extends Firedev.Base.AbstractEntity {
  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  name?: string;
}
//#endregion

//#region  isomorphic-lib controller
@Firedev.Controller({ className: 'UserController' })
class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = ()=> User;
  //#region @websql
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  //#endregion
}
//#endregion

//#region  isomorphic-lib context
const MainContext = Firedev.createContext(()=>({
  host,
  contextName: 'MainContext',
  contexts:{ BaseContext },
  controllers: {
    UserController,
    // PUT FIREDEV CONTORLLERS HERE
  },
  entities: {
    User,
    // PUT FIREDEV ENTITIES HERE
  },
  database: true,
  // disabledRealtime: true,
}));
//#endregion

async function start() {

  await MainContext.initialize();

  if (Firedev.isBrowser) {
    const users = (await MainContext.getClassInstance(UserController).getAll().received)
      .body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;
