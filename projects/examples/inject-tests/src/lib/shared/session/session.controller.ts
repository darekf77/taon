import { Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import { Session } from './sesison';
import { EntityOptions } from 'firedev-typeorm/src';

@Firedev.Controller({
  className: 'SessionController',
})
export class SessionController extends Firedev.Base.CrudController<Session> {
  entityClassResolveFn = () => Session;

  async initExampleDbData(): Promise<any> {
    //#region @websql
    const session = new (SharedContext.types.entitiesFor(this).Session)();
    session.timeout = 3999;
    await this.backend.repo.save(session);

    const all = await this.backend.repo.find();
    console.log('All sessions', all);
    //#endregion
  }
}
