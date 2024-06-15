import { Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import type { User } from './user';

@Firedev.Controller({
  className: 'UserController',
})
export class UserController extends Firedev.Base.CrudController<User> {
  entity() {
    return SharedContext.types.entities.User;
  }

  currentRepo: any;
  currentConnection: any;
  async initExampleDbData(): Promise<any> {
    const admin = new (SharedContext.types.entitiesFor(this).User)();
    admin.name = 'admin';
    admin.email = 'admin@admin.pl';
    admin.password = 'admin';

    const user = new (SharedContext.types.entitiesFor(this).User)();
    user.name = 'test';
    user.email = 'test@test.pl';
    user.password = 'test';

    await this.repo.save([admin, user]);
    const all = await this.repo.find();
  console.log('All users', all);
    console.log(`

    Example data saved


    `,{all});
    // // @LAST change order of crud/controller provider prepositories
  }
}
