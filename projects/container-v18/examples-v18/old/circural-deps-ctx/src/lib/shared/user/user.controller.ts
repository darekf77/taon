import { ClassHelpers, Taon } from 'taon/src';
import { SharedContext } from '../shared.context';
import { User } from './user';

@Taon.Controller({
  className: 'UserController',
})
export class UserController extends Taon.Base.CrudController<User> {
  entityClassResolveFn = () => User;

  currentRepo: any;
  currentConnection: any;
  async initExampleDbData(): Promise<any> {
    //#region @websqlFunc
    const admin = new User();
    admin.name = 'admin';
    admin.email = 'admin@admin.pl';
    admin.password = 'admin';

    const user = new User();
    user.name = 'test';
    user.email = 'test@test.pl';
    user.password = 'test';

    console.log(ClassHelpers.getFullInternalName(this));
    this.db.create(admin);

    await this.db.bulkSave([admin, user]);
    const all = await this.db.find();
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
