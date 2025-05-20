//#region imports
import { CommonModule } from '@angular/common'; // @browser
import { NgModule, inject, Injectable } from '@angular/core'; // @browser
import { Component, OnInit } from '@angular/core'; // @browser
import { VERSION } from '@angular/core'; // @browser
import Aura from '@primeng/themes/aura'; // @browser
import { MaterialCssVarsModule } from 'angular-material-css-vars'; // @browser
import { providePrimeNG } from 'primeng/config'; // @browser
import { Observable, map } from 'rxjs';
import { Taon, BaseContext, TAON_CONTEXT } from 'taon/src';
import { Helpers, UtilsOs } from 'tnp-core/src';

import {
  HOST_BACKEND_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  CLIENT_DEV_NORMAL_APP_PORT,
} from './app.hosts';
//#endregion

console.log('hello world');
console.log('Your server will start on port '+ HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;
const frontendHost =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);

//#region isomorphic-lib-v19 component
//#region @browser
@Component({
  selector: 'app-isomorphic-lib-v19',
  standalone: false,
  template: `hello from isomorphic-lib-v19<br>
    Angular version: {{ angularVersion }}<br>
    <br>
    users from backend
    <ul>
      <li *ngFor="let user of (users$ | async)"> {{ user | json }} </li>
    </ul>
  `,
  styles: [` body { margin: 0px !important; } `],
})
export class IsomorphicLibV19Component {
  angularVersion = VERSION.full + ` mode: ${UtilsOs.isRunningInWebSQL() ? ' (websql)' : '(normal)'}`;
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
}
//#endregion
//#endregion

//#region  isomorphic-lib-v19 api service
//#region @browser
@Injectable({
  providedIn:'root'
})
export class UserApiService {
  userController = Taon.inject(()=> MainContext.getClass(UserController))
  getAll() {
    return this.userController.getAll()
      .received
      .observable
      .pipe(map(r => r.body.json));
  }
}
//#endregion
//#endregion

//#region  isomorphic-lib-v19 module
//#region @browser
@NgModule({
  providers: [
    {
      provide: TAON_CONTEXT,
      useValue: MainContext,
    },
    providePrimeNG({ // inited ng prime - remove if not needed
      theme: {
        preset: Aura
      }
    })
  ],
  exports: [IsomorphicLibV19Component],
  imports: [
    CommonModule,
    MaterialCssVarsModule.forRoot({  // inited angular material - remove if not needed
      primary: '#4758b8',
      accent: '#fedfdd',
   }),
  ],
  declarations: [IsomorphicLibV19Component],
})
export class IsomorphicLibV19Module { }
//#endregion
//#endregion

//#region  isomorphic-lib-v19 entity
@Taon.Entity({ className: 'User' })
class User extends Taon.Base.AbstractEntity {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name?: string;
}
//#endregion

//#region  isomorphic-lib-v19 controller
@Taon.Controller({ className: 'UserController' })
class UserController extends Taon.Base.CrudController<User> {
  entityClassResolveFn = ()=> User;
  //#region @websql
  /**
   * @deprecated use migrations instead
   */
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  //#endregion
}
//#endregion

//#region  isomorphic-lib-v19 context
var MainContext = Taon.createContext(()=>({
  host,
  frontendHost,
  contextName: 'MainContext',
  contexts:{ BaseContext },
  migrations: {
    // PUT TAON MIGRATIONS HERE
  },
  controllers: {
    UserController,
    // PUT TAON CONTROLLERS HERE
  },
  entities: {
    User,
    // PUT TAON ENTITIES HERE
  },
  database: true,
  // disabledRealtime: true,
}));
//#endregion

async function start() {

  await MainContext.initialize();

  if (Taon.isBrowser) {
    const users = (await MainContext.getClassInstance(UserController).getAll().received)
      .body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;