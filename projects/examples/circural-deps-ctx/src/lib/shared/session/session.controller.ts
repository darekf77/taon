import { Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import type { Session } from './sesison';

@Firedev.Controller({
  className: 'SessionController',
})
export class SessionController extends Firedev.Base.CrudController<Session> {
  entity() {
    return SharedContext.types.entities.Session;
  }

  async initExampleDbData(): Promise<any> {}
}
