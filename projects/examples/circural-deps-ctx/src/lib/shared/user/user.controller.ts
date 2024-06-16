import { ClassHelpers, Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import { User } from './user';

@Firedev.Controller({
  className: 'UserController',
})
export class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = () => User;

  currentRepo: any;
  currentConnection: any;
  async initExampleDbData(): Promise<any> {
    //#region @websqlFunc
    const admin = new (SharedContext.types.entitiesFor(this).User)();
    admin.name = 'admin';
    admin.email = 'admin@admin.pl';
    admin.password = 'admin';

    const user = new (SharedContext.types.entitiesFor(this).User)();
    user.name = 'test';
    user.email = 'test@test.pl';
    user.password = 'test';

    console.log(ClassHelpers.getFullInternalName(this));
    this.backend.repo.create(admin);

    await this.backend.repo.save([admin, user]);
    const all = await this.backend.repo.find();
    console.log('All users', all);
    console.log(
      `

    Example data saved


    `,
      { all },
    );
    //#endregion
  }
}
