// @ts-nocheck
//#region imports
import * as os from 'os'; // @backend

import { CommonModule } from '@angular/common'; // @browser
import { NgModule, inject, Injectable } from '@angular/core'; // @browser
import { Component, OnInit } from '@angular/core'; // @browser
import { VERSION } from '@angular/core'; // @browser
import Aura from '@primeng/themes/aura'; // @browser
import { MaterialCssVarsModule } from 'angular-material-css-vars'; // @browser
// @ts-ignore
import { providePrimeNG } from 'primeng/config'; // @browser
import { Observable, map } from 'rxjs';
import {
  Taon,
  TaonBaseContext,
  TAON_CONTEXT,
  EndpointContext,
  TaonBaseMigration,
  TaonBaseCrudController,
  GET,
  TaonBaseAngularService,
  TaonBaseAbstractEntity,
  StringColumn,
  TaonEntity,
  TaonController,
  TaonMigration,
} from 'taon/src';
import { UtilsOs } from 'tnp-core/src';

import { HOST_CONFIG } from './app.hosts';
//#endregion

console.log('hello world');
console.log('Your backend host ' + HOST_CONFIG['MainContext'].host);
console.log('Your frontend host ' + HOST_CONFIG['MainContext'].frontendHost);

//#region taon component
//#region @browser
@Component({
  selector: 'app-taon',
  standalone: false,
  template: `hello from taon<br />
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
export class TaonComponent {
  angularVersion =
    VERSION.full +
    ` mode: ${UtilsOs.isRunningInWebSQL() ? ' (websql)' : '(normal)'}`;

  userApiService = inject(UserApiService);

  readonly users$: Observable<User[]> = this.userApiService.getAll();

  readonly hello$ = this.userApiService.userController
    .helloWorld()
    .request()
    .observable.pipe(map(r => r.body.text));
}
//#endregion
//#endregion

//#region  taon api service
//#region @browser
@Injectable({
  providedIn: 'root',
})
export class UserApiService extends TaonBaseAngularService {
  userController = this.injectController(UserController);

  getAll(): Observable<User[]> {
    return this.userController
      .getAll()
      .request()
      .observable.pipe(map(r => r.body.json));
  }
}
//#endregion
//#endregion

//#region  taon module
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
  exports: [TaonComponent],
  imports: [
    CommonModule,
    MaterialCssVarsModule.forRoot({
      // inited angular material - remove if not needed
      primary: '#4758b8',
      accent: '#fedfdd',
    }),
  ],
  declarations: [TaonComponent],
})
export class TaonModule {}
//#endregion
//#endregion

//#region  taon entity
@TaonEntity({ className: 'User' })
class User extends TaonBaseAbstractEntity {
  //#region @websql
  @StringColumn()
  //#endregion
  name?: string;

  getHello(): string {
    return `hello ${this.name}`;
  }
}
//#endregion

//#region  taon controller
@TaonController({ className: 'UserController' })
class UserController extends TaonBaseCrudController<User> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  entityClassResolveFn = () => User;

  @GET()
  helloWorld(): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      console.log('helloWorld called');
      return 'hello world from backend';
    };
    //#endregion
  }

  @GET()
  getOsPlatform(): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      //#region @backend
      return os.platform(); // for normal nodejs backend return real value
      //#endregion
      return 'no-platform-inside-browser-and-websql-mode';
    };
    //#endregion
  }
}
//#endregion

//#region  taon migration
//#region @websql
@TaonMigration({
  className: 'UserMigration',
})
class UserMigration extends TaonBaseMigration {
  userController = this.injectRepo(User);

  async up(): Promise<any> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.userController.save(superAdmin);
  }
}
//#endregion
//#endregion

//#region  taon context
var MainContext = Taon.createContext(() => ({
  ...HOST_CONFIG['MainContext'],
  contexts: { TaonBaseContext },
  //#region @websql
  /**
   * This is dummy migration - you DO NOT NEED need this migrations object
   * if you are using HOST_CONFIG['MainContext'] that contains 'migrations' object.
   * DELETE THIS 'migrations' object if you use taon CLI that generates
   * migrations automatically inside /src/migrations folder.
   */
  migrations: {
    UserMigration,
  },
  //#endregion
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

async function start(startParams?: Taon.StartParams): Promise<void> {
  await MainContext.initialize();

  //#region @backend
  if (
    startParams.onlyMigrationRun ||
    startParams.onlyMigrationRevertToTimestamp
  ) {
    process.exit(0);
  }
  //#endregion

  //#region @backend
  console.log(`Hello in NodeJs backend! os=${os.platform()}`);
  //#endregion

  if (UtilsOs.isBrowser) {
    const users = (
      await MainContext.getClassInstance(UserController).getAll().request()
    ).body?.json;
    for (const user of users || []) {
      console.log(`user: ${user.name} - ${user.getHello()}`);
    }
  }
}

export default start;