


import {     ENDPOINT, GET, POST, PUT, DELETE,     PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,     Response, getResponseValue, OrmConnection, Connection } from 'morphi/browser';


import { ChildClass } from "./Child1Controller";

@ENDPOINT({ path: (pathes => pathes.join('') + '/superChild') })
export class ChildClass2 extends ChildClass {

    @GET('/saySomething')
    get(): Response<any> {
return undefined;    }

}

export default ChildClass2;