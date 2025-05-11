import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Taon } from 'taon/src';

import type { MyEntity } from './my-entity';
import { MyEntityController } from './my-entity.controller';

@Injectable()
export class MyEntityApiService extends Taon.Base.AngularService {
  private myEntityController: MyEntityController;

  public get allMyEntities$(): Observable<MyEntity[]> {
    return this.myEntityController
      .getAll()
      .received.observable.pipe(map(res => res.body.json));
  }

  constructor() {
    super();
    this.myEntityController = Taon.inject(() =>
      this.currentContext.getClass(MyEntityController),
    );
  }
}
