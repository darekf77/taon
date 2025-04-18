import { Taon } from 'taon/src';
import { User } from './user';

@Taon.Repository({
  className: 'UserRepository',
})
export class UserRepository extends Taon.Base.Repository<User> {
  entityClassResolveFn = () => User;
  amCustomRepository = 'testingisnoin';
  async findByEmail(email: string) {
    //#region @websqlFunc
    return this.repo.findOne({ where: { email } });
    //#endregion
  }
}
