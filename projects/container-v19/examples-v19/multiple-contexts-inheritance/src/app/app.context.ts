import { BaseContext, Taon } from 'taon/src';
import { os } from 'tnp-core/src';

import { FRONTEND_HOST_URL_2, HOST_URL_2 } from '../app.hosts';
import { APP_ID } from '../lib/build-info._auto-generated_';

//#region  app entity
@Taon.Entity({ className: 'App' })
class App extends Taon.Base.AbstractEntity {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  owner?: string;
}
//#endregion

//#region  app controller
@Taon.Controller({ className: 'AppController' })
class AppController extends Taon.Base.CrudController<App> {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  entityClassResolveFn = () => App;
}
//#endregion

//#region  app migration
//#region @websql
@Taon.Migration({
  className: 'AppMigration',
})
class AppMigration extends Taon.Base.Migration {
  appController = this.injectRepo(App);
  async up(): Promise<any> {
    const app = new App();
    app.owner = 'super-admin';
    await this.appController.save(app);
  }
}
//#endregion
//#endregion

//#region  app context
export var AppContext = Taon.createContext(() => ({
  host: HOST_URL_2,
  appId: APP_ID,
  frontendHost: FRONTEND_HOST_URL_2,
  contextName: 'AppContext',
  contexts: { BaseContext },
  migrations: {
    AppMigration,
  },
  controllers: {
    AppController: AppController,
  },
  entities: {
    App,
  },
  database: true,
  // disabledRealtime: true,
}));
//#endregion
