//#region imports
import { Taon } from 'taon/src';
import { Raw } from 'taon-typeorm/src';
import { _ } from 'tnp-core/src';

import { Email } from './email';
//#endregion

@Taon.Controller({
  className: 'EmailRepository',
})
export class EmailRepository extends Taon.Base.Repository<Email> {
  entityClassResolveFn: () => typeof Email = () => Email;

  /**
   * TODO remove this demo example method
   */
  async createEmail(address: string): Promise<Email> {
    //#region @websqlFunc
    const email = await this.save(new Email().clone({ address }));
    return email;
    //#endregion
  }
}
