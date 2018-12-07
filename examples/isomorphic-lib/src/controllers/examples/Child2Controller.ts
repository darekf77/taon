
import {
  ENDPOINT, GET, POST, PUT, DELETE,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, OrmConnection, Connection, CLASSNAME
} from 'morphi';
//#region @backend
import { HelpersBackend } from 'morphi';
//#endregion

import { ChildClass } from './Child1Controller';

@ENDPOINT({ path: '/superChild' })
@CLASSNAME('ChildClass2')
export class ChildClass2 extends ChildClass {

  @GET('/saySomething')
  get(): Response<any> {
    //#region @backendFunc
    const base = super.get();
    return async (req, res) => {
      const send = await HelpersBackend.getResponseValue<string>(base, req, res);
      return `child2(${send})`;
    };
    //#endregion
  }

}

