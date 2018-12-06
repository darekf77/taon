import {
  ENDPOINT, GET, POST, PUT, DELETE,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, OrmConnection, Connection, CLASSNAME
} from 'morphi';


@ENDPOINT()
@CLASSNAME('ParentClass')
export class ParentClass {

  @OrmConnection connection: Connection;

  @GET('/hello')
  get(): Response<any> {
    //#region @backendFunc
    return { send: 'root' };
    //#endregion
  }

  @GET('/loveme')
  loveme(): Response<any> {
    //#region @backendFunc
    return { send: 'I love you' };
    //#endregion
  }

}

