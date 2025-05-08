import { Taon } from 'taon/src';

import { EmailRepository } from '../email/email.repository';

import { User } from './user';
import { Email } from '../email';

@Taon.Repository({
  className: 'UserRepository',
})
export class UserRepository extends Taon.Base.Repository<User> {
  entityClassResolveFn = () => User;

  emailCustomRepository = this.injectCustomRepository(EmailRepository);
  emailRepo = this.injectRepo(Email);
  emailRepo2 = this.injectRepo(Email);
  amCustomRepository = 'testingisnoin';
  async findByEmail(email: string) {
    //#region @websqlFunc
    return this.repo.findOne({ where: { email } });
    //#endregion
  }

  async createUser(partialUser: Partial<User>) {
    let user = await this.save(new User().clone(partialUser));
    const email = await this.emailCustomRepository.createEmail(user.email);
    await this.emailRepo.save(
      new Email().clone({ address: email.address + new Date().getTime() }),
    );
    await this.emailRepo2.save(
      new Email().clone({ address: email.address + new Date().getTime() + 1 }),
    );
    return { user, email };
  }
}
