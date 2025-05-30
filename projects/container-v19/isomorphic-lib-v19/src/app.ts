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
import { UtilsOs } from 'tnp-core/src';

import { HOST_URL, FRONTEND_HOST_URL } from './app.hosts';
//#endregion

console.log('hello world');
console.log('Your server will start on port ' + HOST_URL.split(':')[2]);

//#region isomorphic-lib-v19 component
//#region @browser
@Component({
  selector: 'app-isomorphic-lib-v19',
  standalone: false,
  template: `hello from isomorphic-lib-v19<br />
    Angular version: {{ angularVersion }}<br />
    <br />
    users from backend
    <ul>
      <li *ngFor="let user of users$ | async">{{ user | json }}</li>
    </ul>
    hello world from backend: <strong>{{ hello$ | async }}</strong> `,
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class IsomorphicLibV19Component {
  angularVersion =
    VERSION.full +
    ` mode: ${UtilsOs.isRunningInWebSQL() ? ' (websql)' : '(normal)'}`;
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
  readonly hello$ = this.userApiService.userController
    .helloWorld()
    .received.observable.pipe(map(r => r.body.text));
}
//#endregion
//#endregion

//#region  isomorphic-lib-v19 api service
//#region @browser
@Injectable({
  providedIn: 'root',
})
export class UserApiService extends Taon.Base.AngularService {
  userController = this.injectController(UserController);
  getAll(): Observable<User[]> {
    return this.userController
      .getAll()
      .received.observable.pipe(map(r => r.body.json));
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
      useFactory: () => MainContext,
    },
    providePrimeNG({
      // inited ng prime - remove if not needed
      theme: {
        preset: Aura,
      },
    }),
  ],
  exports: [IsomorphicLibV19Component],
  imports: [
    CommonModule,
    MaterialCssVarsModule.forRoot({
      // inited angular material - remove if not needed
      primary: '#4758b8',
      accent: '#fedfdd',
    }),
  ],
  declarations: [IsomorphicLibV19Component],
})
export class IsomorphicLibV19Module {}
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
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  entityClassResolveFn = () => User;

  @Taon.Http.GET()
  helloWorld(): Taon.Response<string> {
    return async (req, res) => 'hello world';
  }
}
//#endregion

//#region  isomorphic-lib-v19 migration
//#region @websql
@Taon.Migration({
  className: 'UserMigration',
})
class UserMigration extends Taon.Base.Migration {
  userController = this.injectRepo(User);
  async up(): Promise<any> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.userController.save(superAdmin);
  }
}
//#endregion
//#endregion

//#region  isomorphic-lib-v19 context
var MainContext = Taon.createContext(() => ({
  host: HOST_URL,
  frontendHost: FRONTEND_HOST_URL,
  contextName: 'MainContext',
  contexts: { BaseContext },
  migrations: {
    //#region @websql
    UserMigration,
    //#endregion
  },
  controllers: {
    UserController,
  },
  entities: {
    User,
  },
  database: true,
  // disabledRealtime: true,
}));
//#endregion

async function start(): Promise<void> {
  await MainContext.initialize();

  if (Taon.isBrowser) {
    const users = (
      await MainContext.getClassInstance(UserController).getAll().received
    ).body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;
