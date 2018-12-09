import {
  GET, CLASSNAME, isBrowser, isNode, init, ENDPOINT,
  Response,
  AngularProviders
} from 'morphi'
//#region @backend
import { createConnection } from 'typeorm'
//#endregion

const host = 'http://localhost:3000'


@ENDPOINT()
@CLASSNAME('TestController')
class TestController {


  @GET()
  hello(): Response<string> {
    //#region @backendFunc
    return async () => {
      return 'this is amazing haha !'
    }
    //#endregion
  }

}


(async () => {

  //#region @backend
  if (isNode) {
    const connection = await createConnection({
      type: "sqlite",
      database: 'tmp-db.sqlite',
      synchronize: true,
      dropSchema: true,
      logging: false
    })

    init({
      host,
      controllers: [TestController]
    }).expressApp(connection)
  }
  //#endregion

  if (isBrowser) {

    init({
      host,
      controllers: [TestController]
    }).angularProviders()

    const appDiv: HTMLElement = document.getElementById('app');


    let test = new TestController()
    test.hello().received.observable.subscribe(hello => {
      console.log('message from backend !', hello.body.text );
      appDiv.innerHTML = hello.body.text;
    });

  }


})()







