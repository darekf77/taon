import { Taon } from 'taon/src';
import { SharedContext } from '../shared.context';
import { Session } from './sesison';
import { EntityOptions } from 'taon-typeorm/src';

@Taon.Controller({
  className: 'SessionController',
})
export class SessionController extends Taon.Base.CrudController<Session> {
  entityClassResolveFn = () => Session;

  async initExampleDbData(): Promise<any> {}
}
