import { Injectable } from '@angular/core';
import { Firedev } from 'firedev/src';
import { AppContext } from '../app.context';
import { UserController } from './user.controller';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  userControlller = Firedev.inject(() => AppContext.getClass(UserController));
  getAll() {
    return this.userControlller
      .getAll()
      .received.observable.pipe(map(r => r.body.json));
  }
}
