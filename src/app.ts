//#region @notForNpm
//#region imports
import { Firedev } from './lib/index';
import { EMPTY, Observable, catchError, map, of, startWith } from 'rxjs';
import { _ } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import { HOST_BACKEND_PORT } from './app.hosts';
//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntityOptions } from 'firedev-typeorm/src';
//#endregion
//#endregion

//#region @browser
@Component({
  selector: 'app-firedev',
  template: `hello from firedev<br />
    <br />
    users from backend
    <button
      (click)=""
      test="asd">
      refresh
    </button>
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
export class FiredevComponent implements OnInit {
  // @LAST fix base crud
  users$: Observable<User[]>;

  constructor() {}
  ngOnInit() {
    console.log(
      'UserContext.types.entities.User.ctrl.getAll',
      UserContext.types.entities.User.ctrl.getAll(),
    );
    this.users$ = UserContext.types.entities.User.ctrl
      .getAll()
      .received.observable.pipe(map(data => data.body.json));
  }
}

@NgModule({
  imports: [CommonModule],
  exports: [FiredevComponent],
  declarations: [FiredevComponent],
  providers: [],
})
export class FiredevModule {}
//#endregion

//#region user
@Firedev.Entity({
  className: 'User',
})
class User extends Firedev.Base.AbstractEntity {
  public static ctrl = Firedev.inject(
    () => UserContext.types.controllers.UserController,
  );
  public static from(obj: Partial<User>) {
    return _.merge(new User(), obj) as User;
  }

  //#region @websql
  @Firedev.Orm.Column.String()
  //#endregion
  firstName: string;
}

@Firedev.Controller({
  className: 'UserController',
})
class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = () => User;
  userProviers = this.inject(UserProvider);
  async initExampleDbData(): Promise<void> {
    //#region @websql
    Helpers.info(this.userProviers.helloFromUserProvier());
    await this.backend.repo.save(
      UserContext.types.entities.User.from({ firstName: 'pierwszy' }),
    );
    await this.backend.repo.save(
      UserContext.types.entities.User.from({ firstName: 'drugi' }),
    );
    console.log('all users', await this.backend.repo.find());
    //#endregion
  }

  @Firedev.Http.GET()
  hello(
    @Firedev.Http.Param.Query('user') user: string,
  ): Firedev.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      return (
        'hello from user controller my dear query params user "' +
        user +
        '" and ' +
        this.userProviers.helloFromUserProvier()
      );
    };
    //#endregion
  }
}

@Firedev.Provider({
  className: 'UserProvider',
})
class UserProvider extends Firedev.Base.Provider {
  helloFromUserProvier() {
    return 'hello from context ' + this.__endpoint_context__.contextName;
  }
}

const UserContext = Firedev.createContext(() => ({
  contextName: 'UserContext',
  host: `http://localhost:${HOST_BACKEND_PORT}`,
  entities: {
    User,
  },
  controllers: {
    UserController,
  },
  providers: {
    UserProvider,
  },
  repositories: {
    [Firedev.Base.Repository.name]: Firedev.Base.Repository,
  },
  database: true,
}));



// const AppContext = Firedev.createContext({
//   contextName: 'AppContext',
//   host: `http://localhost:${HOST_BACKEND_PORT + 1}`,
//   contexts: { UserContext },
// });
//#endregion

async function start(portForBackend?: string) {
  //#region @backend
  await Helpers.killProcessByPort(HOST_BACKEND_PORT);
  // await Helpers.killProcessByPort(HOST_BACKEND_PORT + 1);
  //#endregion

  // console.log({ portForBackend })
  // console.log('Helpers.isElectron', Helpers.isElectron);

  await UserContext.initialize();
  // await AppContext.initialize();

  console.log('DONE');
  // const s1 = Firedev.inject(SessionContext.controllers.SessionController);
  // const s2 = Firedev.inject(UserContext.controllers.SessionController);
  // console.log({ s1, s2 })
  //#region @backend
  process.stdin.resume();
  //#endregion
}

export default start;

//#endregion
