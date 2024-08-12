import { Morphi } from 'morphi';


@Morphi.Controller({
  className: 'ParentClass'
})
export class ParentClass {

  @Morphi.Http.GET('/hello')
  get(): Morphi.Response<any> {
    //#region @backendFunc
    return { send: 'root' };
    //#endregion
  }

  @Morphi.Http.GET('/loveme')
  loveme(): Morphi.Response<any> {
    //#region @backendFunc
    return { send: 'I love you' };
    //#endregion
  }

}

