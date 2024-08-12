import { Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import { Session } from './sesison';
import { EntityOptions } from 'firedev-typeorm/src';

@Firedev.Controller({
  className: 'SessionController',
})
export class SessionController extends Firedev.Base.CrudController<Session> {
  entityClassResolveFn = () => Session;

  async initExampleDbData(): Promise<any> {}
}
