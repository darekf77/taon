import { ClassHelpers, Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import { User } from './user';
import { UserRepository } from './user.repository';

@Firedev.Controller({
  className: 'UserController',
})
export class UserController extends Firedev.Base.CrudController<User> {
  entityClassResolveFn = () => User;

  backend?: UserRepository = this.inject(UserRepository, {
    localInstance: true,
  });

  currentRepo: any;
  currentConnection: any;
  async initExampleDbData(): Promise<any> {
    //#region @websqlFunc
    const admin = new (SharedContext.types.entitiesFor(this).User)();
    admin.name = 'admin';
    admin.email = 'admin@admin.pl';
    admin.password = 'admin';
    admin.theme = 'light';

    const user = new (SharedContext.types.entitiesFor(this).User)();
    user.name = 'test';
    user.email = 'test@test.pl';
    user.password = 'test';
    user.theme = 'dark';

    // console.log(ClassHelpers.getFullInternalName(this));
    this.backend.repo.create(admin);

    await this.backend.repo.save([admin, user]);
    const all = await this.backend.repo.find();
    const findByEmail = await this.backend.findByEmail('test@test.pl');
    console.log(
      `amCustomRepository `,
      this.backend.amCustomRepository,
      findByEmail,
    );
    console.log('All users', all);
    // console.log(
    //   `

    // Example data saved KURWA

    // `,
    //   { all },
    // );
    //#endregion
  }
}
