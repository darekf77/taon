

import {     ENDPOINT, GET, POST, PUT, DELETE,     PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,     Response, getResponseValue, OrmConnection, Connection } from 'morphi/browser';



@ENDPOINT()
export class ParentClass {

    @OrmConnection connection: Connection;

    @GET('/hello')
    get(): Response<any> {
        return { send: 'root' }
    }

    @GET('/loveme')
    loveme(): Response<any> {
        return { send: 'I love you' }
    }

}



export default ParentClass;