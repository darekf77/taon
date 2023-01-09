import { Morphi } from 'morphi';
import { PIES } from './PIES';

@Morphi.Controller({
  className: 'PiesController',
  entity: PIES,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class PiesController extends Morphi.Base.Controller<PIES> {

  //#region @backend
  async initExampleDbData() {

  }
  //#endregion

}