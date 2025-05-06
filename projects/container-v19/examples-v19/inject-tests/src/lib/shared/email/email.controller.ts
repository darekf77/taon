//#region imports
import { Taon, ClassHelpers } from 'taon/src';
import { _ } from 'tnp-core/src';

import { Email } from './email';
//#endregion

@Taon.Controller({
  className: 'EmailController',
})
export class EmailController extends Taon.Base.CrudController<Email> {
  entityClassResolveFn: () => typeof Email = () => Email;

  //#region methods & getters / hello world
  @Taon.Http.GET()
  helloWord(
    @Taon.Http.Param.Query('yourName') yourName: string,
  ): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      const numOfEntities = await this.db.count();
      return (
        `Hello ${yourName || 'world'} from ${ClassHelpers} ` +
        `controller..  ${numOfEntities} entites in db..`
      );
    };
    //#endregion
  }
  //#endregion
}