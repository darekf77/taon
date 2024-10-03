import { Taon } from 'taon/src';
import { User } from './user';
import { UserSubscriber } from './user.subscriber';

@Taon.Controller({ className: 'UserController' })
export class UserController extends Taon.Base.CrudController<User> {

  entityClassResolveFn = () => User;
  //#region @websql
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  //#endregion
}
