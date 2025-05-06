import { ClassHelpers, Taon } from 'taon/src';
import { SharedContext } from '../shared.context';
import { User } from './user';
import { UserRepository } from './user.repository';

@Taon.Controller({
  className: 'UserController',
})
export class UserController extends Taon.Base.CrudController<User> {
  entityClassResolveFn = () => User;

  userCustomRepository?: UserRepository = this.injectCustomRepo(UserRepository);
  userCrudRepository = this.injectRepo(User);

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
    await this.userCustomRepository.createUser(admin);

    // await this.userCustomRepository.bulkCreate([admin, user]);
    const all = await this.userCustomRepository.getAll();
    // const findByEmail = await this.userCustomRepository.findByEmail('test@test.pl');
    // console.log(
    //   `amCustomRepository `,
    //   this.userCustomRepository.amCustomRepository,
    //   findByEmail,
    // );
    console.log('All users', all);
    //#endregion
  }
}
