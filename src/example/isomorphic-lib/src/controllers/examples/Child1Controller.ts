import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, getResponseValue, OrmConnection, Connection
} from 'morphi';

import { ParentClass } from "./ParentControllers";

@ENDPOINT()
export class ChildClass extends ParentClass {

    @GET('/saySomething')
    get(): Response<any> {
        //#region @backendFunc
        const base = super.get()
        return async (req, res) => {
            const send = await getResponseValue<string>(base, req, res);
            return `child2(${send})`
        }
        //#endregion
    }

}

export default ChildClass;
