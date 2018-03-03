

import {     ENDPOINT, GET, POST, PUT, DELETE,     PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,     Response, getResponseValue, OrmConnection, Connection } from 'morphi/browser';


import { ParentClass } from "./ParentControllers";

@ENDPOINT()
export class ChildClass extends ParentClass {

    @GET('/saySomething')
    get(): Response<any> {
return undefined;    }

}

export default ChildClass;
