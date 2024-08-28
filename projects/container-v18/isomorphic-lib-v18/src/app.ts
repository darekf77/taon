import { Taon } from 'taon';
import { Observable, map } from 'rxjs';
//#region @notForNpm
import { HOST_BACKEND_PORT } from './app.hosts';
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-isomorphic-lib-v18',
  template: `hello from isomorphic-lib-v18<br>
    <br>
    users from backend
    <ul>
      <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
    </ul>
  `,
  styles: [` body { margin: 0px !important; } `],
})
export class IsomorphicLibV18Component implements OnInit {
  users$: Observable<User[]> = User.ctrl.getAll().received.observable
    .pipe(map(data => data.body.json));

  constructor() { }
  ngOnInit() { }
}

@NgModule({
  imports: [CommonModule],
  exports: [IsomorphicLibV18Component],
  declarations: [IsomorphicLibV18Component],
  providers: [],
})
export class IsomorphicLibV18Module { }
//#endregion

@Taon.Entity({ className: 'User' })
class User extends Taon.Base.Entity {
  public static ctrl?: UserController;
  //#region @websql
  @Taon.Orm.Column.Generated()
  //#endregion
  id?: string | number;

}

@Taon.Controller({ className: 'UserController' })
class UserController extends Taon.Base.CrudController<User> {
  entity = ()=> User;
  //#region @websql
  async initExampleDbData(): Promise<void> {
    await this.repository.save(new User())
  }
  //#endregion
}

async function start() {
  console.log('hello world');
  console.log('Your server will start on port '+ HOST_BACKEND_PORT);
  const host = 'http://localhost:' + HOST_BACKEND_PORT;

  const context = await Taon.createContext({
    host,
    contextName: 'context',
    controllers: {
      UserController,
      // PUT FIREDEV CONTORLLERS HERE
    },
    entities: {
      User,
      // PUT FIREDEV ENTITIES HERE
    },
    //#region @websql
    database:true,
    //#endregion
  });
  await context.initialize();

  if (Taon.isBrowser) {
    const users = (await User.ctrl.getAll().received).body.json;
    console.log({
      'users from backend': users
    })
  }
}

export default start;



//#endregion
