import { Injectable } from '@angular/core';
import { MyEntityController } from './my-entity.controller';
import { Taon } from 'taon/src';
import { MyEntityContext } from './my-entity.context';
import { Observable } from 'rxjs';
import type { MyEntity } from './my-entity';
import { map } from 'rxjs/operators';

@Injectable()
export class MyEntityApiService {
  private ctx: typeof MyEntityContext;
  private myEntityController?: MyEntityController;

  get allMyEntities$(): Observable<MyEntity[]> {
    // @ts-ignore
    return this.myEntityController.getAll().received.observable.pipe(
      map((res) => res.body?.json)
    )
  }

  public init(ctx?: typeof MyEntityContext) {
    this.ctx = ctx || MyEntityContext;
    this.myEntityController = Taon.inject(() => this.ctx.getClass(MyEntityController));
  }
}
