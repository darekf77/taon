import { Firedev } from 'firedev'

@Firedev.Entity()
export class USER {

  singYourName() {
    console.log(`helellelleoeo ${this.name}`)
  }
  name: string;
}


@Firedev.Controller()
class UserController {

  @Firedev.Http.GET()
  hello(@Firedev.Http.Param.Query('config') config?: any): Firedev.Response<string> {
    //#region @backendFunc
    return async () => {

      return 'this is cool haha !'
    }
    //#endregion
  }

  @Firedev.Http.GET()
  getEntity(): Firedev.Response<USER> {
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
const controllers: Firedev.Base.Controller<any>[] = [UserController as any];


(async () => {

  //#region @backend
  const config = {
    type: 'better-sqlite3',
    database: 'tmp-db.sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  } as any;
  //#endregion

  Firedev.init({
    host,
    controllers,
    //#region @backend
    config
    //#endregion
  })

  if (Firedev.IsBrowser) {

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







