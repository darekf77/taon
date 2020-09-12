import * as _ from 'lodash';
//#region @backend
import * as fse from 'fs-extra';
//#endregion
import { Morphi } from './index';

const host = 'http://localhost:3333';



@Morphi.Entity({ className: 'Book' })
class Book extends Morphi.Base.Entity<any> {
  static from(name: string) {
    const b = new Book();
    b.name = name;
    return b;
  }

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  public name: string

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  public id: number

}



@Morphi.Controller({ className: 'BookCtrl', entity: Book })
class BookCtrl extends Morphi.Base.Controller<any> {
  //#region @backend
  async initExampleDbData() {
    const db = await this.connection.getRepository(Book);
    await db.save(Book.from('alice in wonderland'));
    await db.save(Book.from('cryptography'));
  }
  //#endregion
}

const start = async function () {

  //#region @backend
  const config = {
    type: "sqlite",
    database: 'tmp-db.sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  } as any;
  //#endregion

  const context = await Morphi.init({
    host,
    controllers: [BookCtrl],
    entities: [Book],
    //#region @backend
    config
    //#endregion
  });
  console.log(context);
  if (Morphi.IsBrowser) {
    const c: BookCtrl = _.first(context.controllers);
    const data = (await c.getAll().received).body.json as Book[];
    console.log(data);
    data.forEach(b => {
      b.subscribeRealtimeUpdates();
    })
  }
  //#region @backend
  if (Morphi.isNode) {

  }

  //#endregion
}

if (Morphi.IsBrowser) {
  start()
}


export default start;
