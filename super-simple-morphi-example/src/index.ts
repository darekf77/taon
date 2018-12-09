import {
  GET, CLASSNAME, isBrowser, isNode, init, ENDPOINT,
  Response,
  //#region @backend
  createConnection,
  //#endregion
  AngularProviders
} from 'morphi'


@ENDPOINT()
class TestController {


  @GET()
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
  const connection= await createConnection({
    type: "sqlite",
    database: 'tmp-db.sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  }) as any;
  //#endregion

  init({
    host,
    controllers,
    //#region @backend
    connection
    //#endregion
  })

  if (isBrowser) {

    const body: HTMLElement = document.getElementsByTagName('body')[0];
    let test = new TestController()
    test.hello().received.observable.subscribe(dataFromBackend => {
      body.innerHTML = `<h1>${dataFromBackend.body.text}</h1>`;
    });

    const helloData = await test.hello().received
    console.log('Realtime hsould not be inited', helloData.body.text)

  }

})()







