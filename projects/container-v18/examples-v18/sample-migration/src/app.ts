//#region imports
import { Taon, BaseContext } from 'taon/src';
import { Helpers } from 'tnp-core/src';
import { Observable, map } from 'rxjs';
import {
  HOST_BACKEND_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  CLIENT_DEV_NORMAL_APP_PORT,
} from './app.hosts';
import { MigrationInterface, QueryRunner } from 'taon-typeorm/src';
//#region @browser
import { NgModule, inject, Injectable } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VERSION } from '@angular/core';
//#endregion
//#endregion

console.log('hello world');
console.log('Your server will start on port ' + HOST_BACKEND_PORT);
const host = 'http://localhost:' + HOST_BACKEND_PORT;
const frontendHost =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);

//#region sample-migration component
//#region @browser
@Component({
  selector: 'app-sample-migration',
  template: `hello from sample-migration<br />
    Angular version: {{ angularVersion }}<br />
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
  imports: [CommonModule],
  declarations: [SampleMigrationComponent],
})
export class SampleMigrationModule {}
//#endregion
//#endregion

//#region  sample-migration migration

export class PostRefactoringTIMESTAMP implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    //#region @websqlFunc
    await queryRunner.query(
      // add a new random record to USER table
      `INSERT INTO "User" ("name", "age") VALUES ('John Doe', 30)`,
    );
    //#endregion
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    //#region @websqlFunc
    await queryRunner.query(
      // remove the record added in "up" method
      `DELETE FROM "User" WHERE "name" = 'John Doe' AND "age" = 30`,
    ); // reverts things made in "up" method
    //#endregion
  }
}
//#endregion

//#region  sample-migration entity
@Taon.Entity({ className: 'User' })
class User extends Taon.Base.AbstractEntity {
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
    // const superAdmin = new User();
    // superAdmin.name = 'super-admin';
    // await this.db.save(superAdmin);
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
  migrations: { PostRefactoringTIMESTAMP },
  controllers: {
    UserController,
    // PUT TAON CONTROLLERS HERE
  },
  entities: {
    User,
    // PUT TAON ENTITIES HERE
  },
  database: {
    recreateMode: 'PRESERVE_DATA+MIGRATIONS',
  },
  logs: {
    db: true,
    framework: true,
  },
  // disabledRealtime: true,
}));
//#endregion

async function start() {
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
