import { ClassHelpers, Taon } from 'taon/src';
import { SharedContext } from '../shared.context';
import { Admin } from './admin';
import { User } from '../user/user';
import { UserController } from '../user/user.controller';

@Taon.Controller({
  className: 'AdminController',
})
export class AdminController extends UserController {
  entityClassResolveFn = () => Admin;

  helloWorldFromAdmin = 'hello world from admin';
  async initExampleDbData(): Promise<any> {
    //#region @websqlFunc

    //#endregion
  }
}
