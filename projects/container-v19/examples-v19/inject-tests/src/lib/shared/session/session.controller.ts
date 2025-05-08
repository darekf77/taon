import { Taon } from 'taon/src';
import { SharedContext } from '../shared.context';
import { Session } from './sesison';
import { EntityOptions } from 'taon-typeorm/src';
import { Admin } from '../admin/admin';
import { AdminController } from '../admin/admin.controller';
import { UserRepository } from '../user/user.repository';

@Taon.Controller({
  className: 'SessionController',
})
export class SessionController extends Taon.Base.CrudController<Session> {
  entityClassResolveFn = () => Session;

  userCustomRepo = this.injectCustomRepo(UserRepository);
  adminController = this.injectController(AdminController);

  sessionRepo = this.injectRepo(Session);


  async initExampleDbData(): Promise<any> {
    //#region @websql

    console.log('this.sessionCrud.getAll', this.sessionRepo.getAll);
    console.log(this.adminController.helloWorldFromAdmin);
    console.log('userCustomRepo', this.userCustomRepo.amCustomRepository);

    const session = new (Session)();
    session.timeout = 3999;
    await this.db.save(session);
    const session2 = new (Session)();
    session2.timeout = 234;
    await this.sessionRepo.save(session2 as any);

    const allSessions = await this.db.getAll();
    console.log('All sessions', allSessions);
    //#endregion
  }
}
