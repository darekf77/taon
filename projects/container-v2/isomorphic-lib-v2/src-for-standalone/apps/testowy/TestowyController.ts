
import { Morphi } from 'morphi';
import { TESTOWY } from './TESTOWY';
import * as _ from 'lodash';

@Morphi.Controller({
  className: 'TestowyController',
  entity: TESTOWY,
  //#region @backend
  // auth: () => {
  //   return authenticate('bearer', { session: false });
  // }
  //#endregion
})
export class TestowyController extends Morphi.Base.Controller<TESTOWY> {

  thisIsSomething() {

  }

  //#region @backend
  async initExampleDbData() {
    const repo = await this.connection.getRepository(TESTOWY);
    for (let index = 0; index < 5; index++) {
      let model = new TESTOWY();
      model.exampleProperty = `m${index}`;
      await repo.save(model);
    }
  }
  //#endregion


  @Morphi.Http.GET()
  circualDep(): Morphi.Response<TESTOWY[]> {
    //#region @backendFunc
    let model = new TESTOWY();
    model.exampleProperty = 'pierwszy'
    let model1 = new TESTOWY();
    model.werka = model1;
    model1.exampleProperty = 'z werka'
    model1.werka = model;

    return async () => {
      return () => [model, model1];
    }
    //#endregion
  }

}
