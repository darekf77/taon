import { Firedev } from 'firedev/src';
import { User } from './user';
import { UserSubscriber } from './user.subscriber';

@Firedev.Controller({ className: 'UserController' })
export class UserController extends Firedev.Base.CrudController<User> {

  entityClassResolveFn = () => User;
  //#region @websql
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  //#endregion
}
