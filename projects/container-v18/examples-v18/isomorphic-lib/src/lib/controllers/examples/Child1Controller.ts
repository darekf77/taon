import { Morphi } from 'morphi';


import { ParentClass } from './ParentControllers';

@Morphi.Controller({
  className: 'ChildClass'
})
export class ChildClass extends ParentClass {

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
