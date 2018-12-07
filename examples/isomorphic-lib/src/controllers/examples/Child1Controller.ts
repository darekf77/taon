import {
  ENDPOINT, GET, POST, PUT, DELETE,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, Helpers, OrmConnection, Connection, CLASSNAME
} from 'morphi';
//#region @backend
import { HelpersBackend } from 'morphi';
//#endregion

import { ParentClass } from './ParentControllers';

@ENDPOINT()
@CLASSNAME('ChildClass')
export class ChildClass extends ParentClass {

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
