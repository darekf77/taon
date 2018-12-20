import { Morphi } from 'morphi'
import * as fs from 'fs';

@Morphi.Entity()
export class USER {

  singYourName() {
    console.log(`helellelleoeo ${this.name}`)
  }
  name: string;
}


@Morphi.Controller()
class UserController {

  @Morphi.Http.GET()
  hello(@Morphi.Http.Param.Query('config') config?: any): Morphi.Response<string> {
    //#region @backendFunc
    return async () => {

      return 'this is cool haha !'
    }
    //#endregion
  }

  @Morphi.Http.GET()
  getEntity(): Morphi.Response<USER> {
    //#region @backendFunc
    return async () => {
      let u = new USER();
      u.name = 'test '
      return u;
    }
    //#endregion
  }

}

const host = 'http://localhost:3000'
const controllers: Morphi.Base.Controller<any>[] = [UserController as any];


(async () => {

  //#region @backend
  const config = {
    type: "sqlite",
    database: 'tmp-db.sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  } as any;
  //#endregion

  Morphi.init({
    host,
    controllers,
    //#region @backend
    config
    //#endregion
  })

  if (Morphi.IsBrowser) {

    const body: HTMLElement = document.getElementsByTagName('body')[0];
    let test = new UserController()
    test.hello({ siema: 'siema' }).received.observable.subscribe(dataFromBackend => {
      body.innerHTML = `<h1>${dataFromBackend.body.text}</h1>`;
    });

    const helloData = await test.hello().received
    console.log('Realtime hsould not be inited', helloData.body.text)


    test.getEntity().received.observable.subscribe(user => {
      const u = user.body.json;
      console.log('USER', u)
      u.singYourName()
    })

  }

})()







