import { Injectable } from '@angular/core';
import { MyEntityController } from './my-entity.controller';
import { Taon } from 'taon/src';
import { MyEntityContext } from './my-entity.context';
import { Observable } from 'rxjs';
import type { MyEntity } from './my-entity';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MyEntityApiService {
  private myEntityController: MyEntityController = Taon.inject(() => MyEntityContext.getClass(MyEntityController));

  get allMyEntity$(): Observable<MyEntity[]> {
    return this.myEntityController.getAll().received.observable.pipe(
      map((res) => res.body?.json)
    )
  }
}
