

import { Morphi } from 'morphi';
// local
import { TestUser } from '../../entities/examples/User';


@Morphi.Controller({
  className: 'UsersController',
  entity: TestUser
})
export class UsersController extends Morphi.Base.Controller<TestUser>
{

  //#region @backend
  async initExampleDbData() {
    const user = new TestUser();
    user.name = 'Dariusz';
    user.username = 'darekf77';
    await this.repository.save(user);
  }
  //#endregion

}
