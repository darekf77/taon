//#region imports
import { CommonModule } from '@angular/common';
import { Component, inject, Injectable, NgModule, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable,
  Subject,
  debounce,
  debounceTime,
  map,
  of,
  scan,
} from 'rxjs';
import { Taon, BaseContext } from 'taon/src';
import { Helpers } from 'tnp-core/src';
import { _ } from 'tnp-core/src';

import {
  CLIENT_DEV_NORMAL_APP_PORT,
  CLIENT_DEV_WEBSQL_APP_PORT,
  HOST_BACKEND_PORT,
} from './app.hosts';
//#endregion

//#region constants
const host1 = 'http://localhost:' + HOST_BACKEND_PORT;
const frontendHost1 =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);
const saveNewUserEventKey = 'saveNewUserEventKey';
//#endregion

//#region realtime-subscribers component
//#region @browser
@Component({
  template: `hello from realtime subscribers<br />
    <br />
    <button (click)="saveNewUser()">save new user</button>
    <br />`,
  standalone: false,
})
@UntilDestroy()
export class RealtimeClassSubscriberComponent implements OnInit {
  $destroy = new Subject();
  readonly messages$: Observable<string[]> = of([]);

  saveNewUser() {
    MainContext.realtime.client.triggerCustomEvent(saveNewUserEventKey);
  }

  ngOnInit(): void {
    console.log('realtime client subscribers start listening!');

    MainContext.realtime.client
      .listenChangesEntityTable(UserEntity)
      .pipe(untilDestroyed(this), debounceTime(1000))
      .subscribe(message => {
        console.log('realtime message from class subscriber ', message);
      });
  }
}
//#endregion
//#endregion

//#region realtime-subscriber entity
@Taon.Entity({
  className: 'UserEntity',
})
export class UserEntity extends Taon.Base.Entity {
  //#region @websql1
  @Taon.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name: string;
}
//#endregion

@Taon.Subscriber({
  className: 'RealtimeClassSubscriber',
})
export class RealtimeClassSubscriber extends Taon.Base.SubscriberForEntity {
  listenTo() {
    return MainContext.getClass(UserEntity);
  }

  afterInsert(entity: any) {
    console.log(`AFTER INSERT: `, entity);
    MainContext.realtime.server.triggerEntityTableChanges(UserEntity);
  }
}

@Taon.Controller({
  className: 'RealtimeUserController',
})
export class RealtimeUserController extends Taon.Base
  .CrudController<UserEntity> {
  entityClassResolveFn = () => UserEntity;
  realtimeClassSubscriber = this.injectSubscriber(RealtimeClassSubscriber);
  async initExampleDbData() {
    //#region @websql
    await this.saveNewUser();
    //#endregion
  }

  async saveNewUser() {
    //#region @websqlFunc
    const counterUser = await this.db.count();
    await this.db.save(
      _.merge(new UserEntity(), { name: 'user' + (counterUser + 1) }),
    );
    Helpers.info(`new user${counterUser + 1} saved.`);
    //#endregion
  }
}

//#region  realtime-subscribers context
var MainContext = Taon.createContext(() => ({
  host: host1,
  frontendHost: frontendHost1,
  contextName: 'MainContext',
  contexts: { BaseContext },
  controllers: { RealtimeUserController },
  subscribers: { RealtimeClassSubscriber },
  entities: { RealtimeUserEntity: UserEntity },
  database: true,
  logs: {
    realtime: true,
    // db: true,
    // framework: true,
  },
}));
//#endregion

//#region start
async function start() {
  const ref = await MainContext.initialize();
  const realtimeUserController = ref.getInstanceBy(RealtimeUserController);

  //#region @websql
  MainContext.realtime.server
    .listenChangesCustomEvent(saveNewUserEventKey)
    .subscribe(async () => {
      console.log('save new user event');
      await realtimeUserController.saveNewUser();
    });
  //#endregion
}

export default start;
//#endregion

//#region  realtime-class-subscriber module
//#region @browser
@NgModule({
  declarations: [RealtimeClassSubscriberComponent],
  imports: [CommonModule],
  exports: [RealtimeClassSubscriberComponent],
})
export class RealtimeClassSubscriberModule {}
//#endregion
//#endregion
