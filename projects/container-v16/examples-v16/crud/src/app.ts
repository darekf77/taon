//#region imports
import { BaseContext, Firedev } from 'firedev/src';
import { Observable, map } from 'rxjs';
import { HOST_BACKEND_PORT } from './app.hosts';
//#region @websql
import { getMetadataArgsStorage } from 'firedev-typeorm/src';
//#endregion
//#region @browser
import { Injectable, NgModule, inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
//#endregion
//#endregion

//#region @browser
//#region app crud component
@Component({
  selector: 'app-crud',
  template: `hello from crud<br />
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
export class CrudComponent {
  userApiService = inject(UserApiService);
  users$ = this.userApiService.getAll();

  constructor() {}
}
//#endregion

//#region api service
@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  userController = Firedev.inject(
    () => Context.types.controllers.UserController,
  );

  getAll() {
    return this.userController
      .getAll()
      .received.observable.pipe(map(data => data.body.json));
  }
}
//#endregion

//#region module
@NgModule({
  imports: [CommonModule],
  exports: [CrudComponent],
  declarations: [CrudComponent],
  providers: [],
})
export class CrudModule {}
//#endregion
//#endregion

//#region entity
@Firedev.Entity({ className: 'User' })
class User extends Firedev.Base.AbstractEntity {

  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  name: string;
}
//#endregion

//#region controller
@Firedev.Controller({ className: 'UserController', realtime: false })
class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = () => User;

  async initExampleDbData(): Promise<void> {
    //#region @websql
    await this.db.save(new (User)().clone({ name: 'Dariusz' }));
    //#endregion
  }
}
//#endregion

console.log('hello world');
console.log('Your server will start on port ' + HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;

var Context = Firedev.createContext(() => ({
  host,
  contextName: 'Context',
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
  // logs: true,
  // override: {
  //   entities:[User]
  // }
}));

async function start() {
  await Context.initialize();

  if (Firedev.isBrowser) {
    const users = (await Context.getClassInstance(UserController).getAll().received)
      .body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;
