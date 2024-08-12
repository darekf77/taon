import { ClassHelpers, Firedev } from 'firedev/src';
import { SharedContext } from '../shared.context';
import { Admin } from './admin';
import { User } from '../user/user';
import { UserController } from '../user/user.controller';

@Firedev.Controller({
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
