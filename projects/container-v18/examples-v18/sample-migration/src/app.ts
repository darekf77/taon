//#region imports
import {
  Taon,
  BaseContext,
  TaonAdminModeConfigurationComponent,
} from 'taon/src';
import { Helpers } from 'tnp-core/src';
import { Observable, map } from 'rxjs';
import {
  HOST_BACKEND_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  CLIENT_DEV_NORMAL_APP_PORT,
} from './app.hosts';
import { MigrationInterface, QueryRunner } from 'taon-typeorm/src';
import {
  MIGRATIONS_CLASSES_FOR_MainContext,
  MIGRATIONS_CLASSES_FOR_SecondContext,
} from './migrations';
//#region @browser
import { NgModule, inject, Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VERSION } from '@angular/core';
//#endregion
//#endregion

console.log('[app.ts] hello world');
console.log('[app.ts] Your server will start on port ' + HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;
const host2 = 'http://localhost:' + (HOST_BACKEND_PORT + 1);
const frontendHost =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);

const frontendHost2 =
  'http://localhost:' +
  ((Helpers.isWebSQL
    ? CLIENT_DEV_WEBSQL_APP_PORT
    : CLIENT_DEV_NORMAL_APP_PORT) +
    1);

//#region sample-migration component
//#region @browser
@Component({
  selector: 'app-sample-migration',
  template: `
    <taon-admin-mode-configuration>
      hello from sample-migration<br />
      Angular version: {{ angularVersion }}<br />
      <br />
      users from backend
      <ul>
        <li *ngFor="let user of users$ | async">{{ user | json }}</li>
      </ul>
    </taon-admin-mode-configuration>
  `,
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class SampleMigrationComponent {
  angularVersion = VERSION.full;
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
}
//#endregion
//#endregion

//#region  sample-migration api service
//#region @browser
@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  userController = Taon.inject(() => MainContext.getClass(UserController));
  getAll() {
    return this.userController
      .getAll()
      .received.observable.pipe(map(r => r.body.json));
  }
}
//#endregion
//#endregion

//#region  sample-migration module
//#region @browser
@NgModule({
  exports: [SampleMigrationComponent],
  imports: [CommonModule, TaonAdminModeConfigurationComponent],
  declarations: [SampleMigrationComponent],
})
export class SampleMigrationModule {}
//#endregion
//#endregion

//#region  sample-migration entity
@Taon.Entity({ className: 'User' })
export class User extends Taon.Base.AbstractEntity<User> {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name?: string;

  //#region @websql
  @Taon.Orm.Column.Number()
  //#endregion
  age?: number;
}
//#endregion

//#region  sample-migration controller
@Taon.Controller({ className: 'UserController' })
class UserController extends Taon.Base.CrudController<User> {
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

//#region  sample-migration context
var MainContext = Taon.createContext(() => ({
  host,
  frontendHost,
  contextName: 'MainContext',
  contexts: { BaseContext },
  migrations: { ...MIGRATIONS_CLASSES_FOR_MainContext },
  controllers: {
    UserController,
    // PUT TAON CONTROLLERS HERE
  },
  entities: {
    User,
    // PUT TAON ENTITIES HERE
  },
  database: true,
  logs: {
    // db: true,
    // framework: true,
    // migrations: true,
  },
  // disabledRealtime: true,
}));
//#endregion

//#region  sample-migration context
var SecondContext = Taon.createContext(() => ({
  host: host2,
  frontendHost: frontendHost2,
  contextName: 'SecondContext',
  contexts: { BaseContext },
  migrations: { ...MIGRATIONS_CLASSES_FOR_SecondContext },
  controllers: {
    UserController,
    // PUT TAON CONTROLLERS HERE
  },
  entities: {
    User,
    // PUT TAON ENTITIES HERE
  },
  database: true,
  logs: {
    // db: true,
    // framework: true,
    // migrations: true,
  },
  // disabledRealtime: true,
}));
//#endregion

async function start(params?: Taon.StartParams) {
  await MainContext.initialize(params);
  await SecondContext.initialize(params);

  //#region @backend
  if (params.onlyMigrationRun || params.onlyMigrationRevertToTimestamp) {
    process.exit(0);
  }
  //#endregion

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
