import { Injectable } from '@angular/core';
import { Taon } from 'taon/src';
import { AppContext } from '../app.context';
import { UserController } from './user.controller';
import { map } from 'rxjs';
import { UserSubscriber } from './user.subscriber';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  userControlller = Taon.inject(() => AppContext.getClass(UserController));
  userCustomevent = Taon.injectSubscriberEvents(
    () => AppContext.getClass(UserSubscriber),
    'customEvent',
  );

  getAll() {
    return this.userControlller
      .getAll()
      .received.observable.pipe(map(r => r.body.json));
  }
}
