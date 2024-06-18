import { Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import { Session } from './sesison';
import { EntityOptions } from 'firedev-typeorm/src';
import { Admin } from '../admin/admin';
import { AdminController } from '../admin/admin.controller';
import { UserRepository } from '../user/user.repository';

@Firedev.Controller({
  className: 'SessionController',
})
export class SessionController extends Firedev.Base.CrudController<Session> {
  entityClassResolveFn = () => Session;

  userCustomRepo = this.injectCustomRepo(UserRepository);
  adminController = this.injectController(AdminController);

  sessionRepo = this.injectRepo(Session);


  async initExampleDbData(): Promise<any> {
    //#region @websql

    console.log('this.sessionCrud.getAll', this.sessionRepo.getAll);
    console.log(this.adminController.helloWorldFromAdmin);
    console.log('userCustomRepo', this.userCustomRepo.amCustomRepository);

    const session = new (SharedContext.types.entitiesFor(this).Session)();
    session.timeout = 3999;
    await this.backend.create(session);
    const session2 = new (SharedContext.types.entitiesFor(this).Session)();
    session2.timeout = 234;
    await this.sessionRepo.create(session2 as any);

    const allSessions = await this.backend.getAll();
    console.log('All sessions', allSessions);
    //#endregion
  }
}
