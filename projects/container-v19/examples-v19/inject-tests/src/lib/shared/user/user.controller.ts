import { ClassHelpers, Taon } from 'taon/src';
import { SharedContext } from '../shared.context';
import { User } from './user';
import { UserRepository } from './user.repository';

@Taon.Controller({
  className: 'UserController',
})
export class UserController extends Taon.Base.CrudController<User> {
  entityClassResolveFn = () => User;

  backend?: UserRepository = this.injectCustomRepo(UserRepository);
  back = this.injectRepo(User);

  async initExampleDbData(): Promise<any> {
    //#region @websqlFunc

    const admin = new User();
    admin.name = 'admin';
    admin.email = 'admin@admin.pl';
    admin.password = 'admin';
    admin.theme = 'light';

    const user = new User();
    user.name = 'test';
    user.email = 'test@test.pl';
    user.password = 'test';
    user.theme = 'dark';

    // console.log(ClassHelpers.getFullInternalName(this));
    await this.backend.create(admin);

    await this.backend.bulkCreate([admin, user]);
    const all = await this.backend.getAll();
    const findByEmail = await this.backend.findByEmail('test@test.pl');
    console.log(
      `amCustomRepository `,
      this.backend.amCustomRepository,
      findByEmail,
    );
    console.log('All users', all);
    //#endregion
  }
}
