import {
  GET, CLASSNAME, isBrowser, isNode, init, ENDPOINT,
  Response,
  //#region @backend
  createConnection,
  //#endregion
  AngularProviders
} from 'morphi'


@ENDPOINT()
@CLASSNAME('TestController')
class TestController {


  @GET('/hello')
  hello(): Response<string> {
    //#region @backendFunc
    return async () => {
      return 'this is cool haha !'
    }
    //#endregion
  }

}

const host = 'http://localhost:3000'
const controllers = [TestController];


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
      controllers
    }).expressApp(connection)
  }
  //#endregion

  if (isBrowser) {

    init({
      host,
      controllers
    }).angularProviders()

    const body: HTMLElement = document.getElementsByTagName('body')[0];


    let test = new TestController()
    test.hello().received.observable.subscribe(dataFromBackend => {
      body.innerHTML = `<h1>${dataFromBackend.body.text.replace(/\"/g, '')}</h1>`;
    });

  }


})()







