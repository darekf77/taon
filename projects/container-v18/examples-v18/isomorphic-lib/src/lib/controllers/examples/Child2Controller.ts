
import { Morphi } from 'morphi';

import { ChildClass } from './Child1Controller';

@Morphi.Controller({
  path: '/superChild',
  className: 'ChildClass2'
})
export class ChildClass2 extends ChildClass {

  @Morphi.Http.GET('/saySomething')
  get(): Morphi.Response<any> {
    //#region @backendFunc
    const base = super.get();
    return async (req, res) => {
      const send = await Morphi.getResponseValue<string>(base, req, res);
      return `child2(${send})`;
    };
    //#endregion
  }

}

