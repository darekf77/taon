import { Firedev } from 'firedev/src';
import { User } from './user';

@Firedev.Repository({
  className: 'UserRepository',
})
export class UserRepository extends Firedev.Base.Repository<User> {
  entityClassResolveFn = () => User;
  amCustomRepository = 'testingisnoin';
  async findByEmail(email: string) {
    //#region @websqlFunc
    return this.repo.findOne({ where: { email } });
    //#endregion
  }
}
