//#region @notForNpm
import { _ } from 'tnp-core';
import { Morphi as Firedev } from './index';
// console.log({ isE2E })
//#region @browser
import { NgModule, Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
//#endregion
import { Log } from 'ng2-logger';
import { CLASS } from 'typescript-class-helpers';
import { IsomorphicBroadCastChannel } from './lib/realtime/broadcast-channel-dummy';
const log = Log.create('firedev framework app');

const LOG_QUERIES = false;

const host1 = `http://localhost:3111`;
const host2 = `http://localhost:3222`;

//#region STUDENT entity
@Firedev.Entity({ className: 'Student' })
class Student {
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  public id: number;

  //#region @websql
  @Firedev.Orm.Column.Custom('varchar')
  //#endregion
  public firstName: string

  //#region @websql
  @Firedev.Orm.Column.Custom('varchar')
  //#endregion
  public lastName: string

}
//#endregion

//#region USER entity
@Firedev.Entity({ className: 'User' })
class User {
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  public id: number;

  //#region @websql
  @Firedev.Orm.Column.Custom('varchar')
  //#endregion
  public firstName: string

  //#region @websql
  @Firedev.Orm.Column.Custom('varchar')
  //#endregion
  public lastName: string
}
//#endregion

//#region BOOK entity
@Firedev.Entity({ className: 'Book' })
class Book extends Firedev.Base.Entity<any> {
  static from(name: string) {
    const b = new Book();
    b.name = name;
    return b;
  }

  static ctrl: BookCtrl;
  static async getAll() {
    const data = await this.ctrl.getAll().received;
    return data.body.json;
  }

  //#region @websql
  @Firedev.Orm.Column.Custom('varchar')
  //#endregion
  public name: string

  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  public id: number
}
//#endregion

//#region UserController
@Firedev.Controller({ className: 'UserController' })
class UserController {
  @Firedev.Http.GET()
  helloWorld(): Firedev.Response<string> {
    return async (req, res) => {
      return 'hello world from here';
    }
  }
}
//#endregion

//#region StudentController
@Firedev.Controller({ className: 'StudentController', entity: Student })
class StudentController extends Firedev.Base.Controller<any>  {
  @Firedev.Http.GET()
  helloStudencie(): Firedev.Response<string> {
    return async (req, res) => {
      return 'hello world from here';
    }
  }
}
//#endregion

//#region BookController
@Firedev.Controller({ className: 'BookCtrl', entity: Book })
class BookCtrl extends Firedev.Base.Controller<any> {
  //#region @websql
  async initExampleDbData() {
    const db = await this.connection.getRepository(Book);
    await db.save(Book.from('alice in wonderland'));
    await db.save(Book.from('cryptography'));


    const allBooks = await db.find();
    console.log('ALL BOOKS', allBooks);
  }
  //#endregion

  @Firedev.Http.GET()
  helloWorld(): Firedev.Response<string> {
    return async (req, res) => {
      return 'hello world';
    }
  }

  @Firedev.Http.GET()
  getBook(): Firedev.Response<any> {
    return async (req, res) => {
      return Object.assign(new Book(), { name: 'angular bppl' });
    }
  }
}
//#endregion

//#region Morphi Component
//#region @browser
@Component({
  selector: 'app-morphi',
  styleUrls: ['./app.scss'],
  template: `
hello world
<img src="/src/assets/logo-flower.png" alt="image"><img>

<div  class="my-pic" > </div>

  `
})
export class MorphiComponent implements AfterViewInit, OnInit {
  async ngAfterViewInit() { }

  async ngOnInit() {
    await start();
    // const bookObj = (await Book.ctrl.getBook().received);
    // console.log({ bookObj });
    // console.log({ book: bookObj.body.json });
  }

  constructor(ngzone: NgZone) { Firedev.initNgZone(ngzone); }
}
//#endregion
//#endregion

//#region Morphi module
//#region @browser
@NgModule({
  imports: [],
  exports: [MorphiComponent],
  declarations: [MorphiComponent],
})
export class MorphiModule { }
//#endregion
//#endregion

async function start() {

  // //#region context 1
  // const context1 = await Firedev.init({
  //   host: host1,
  //   controllers: [
  //     BookCtrl,
  //   ],
  //   entities: [
  //     Book,
  //   ],
  //   //#region @websql
  //   config: {
  //     type: 'better-sqlite3',
  //     database: 'tmp-db1.sqlite',
  //     synchronize: true,
  //     dropSchema: true,
  //     logging: LOG_QUERIES
  //   }
  //   //#endregion
  // });
  // console.log(context1);
  // //#endregion

  // //#region context 2
  // const context2 = await Firedev.init({
  //   host: host2,
  //   controllers: [
  //     UserController,
  //     StudentController,
  //   ],
  //   entities: [
  //     User,
  //     Student,

  //   ],
  //   //#region @websql
  //   config: { // @ts-ignore
  //     type: "better-sqlite3",
  //     database: 'tmp-db2.sqlite',
  //     synchronize: true,
  //     dropSchema: true,
  //     logging: LOG_QUERIES
  //   }
  //   //#endregion
  // });
  // console.log(context2);

  // //#endregion

  // //#region @websql
  // if (Firedev.IsBrowser) {

  //   const ctrl = _.first(context2.crudControllersInstances);
  //   const data = (await ctrl.getAll().received).body.json as Book[];
  //   console.log('context 2', data);


  //   let i = 0;
  //   Firedev.Realtime.Browser.listenChangesEntity(Book, 1).subscribe(() => {
  //     console.log(`realtime update of Book with id=1 (` + i++ + ')')
  //   })

  //   let j = 0

  //   Firedev.Realtime.Browser.listenChangesEntity(Book, 2, { property: 'name' }).subscribe((d) => {
  //     console.log('realtime update of Book with id 2 for property "name" (' + j++ + ')', d)
  //   });

  // }


  // // notifyBookUpdate(Book, 1);
  // // notifyBookUpdate(Book, 2, 'name');
  // //#endregion

  const b1 = IsomorphicBroadCastChannel.for('b1', 'http://localhost:4201/test');
  b1.onmessage = (a) => {
    console.log(`Message from b1`, a)
  }
  const b2 = IsomorphicBroadCastChannel.for('b1', 'http://localhost:4200/test');
  b2.onmessage = (a) => {
    console.log(`Message from b2`, a)
  }

  IsomorphicBroadCastChannel.for('b1', 'http://localhost:4201/test').postMessage('raw from b1')
  IsomorphicBroadCastChannel.for('b3', 'http://localhost:4201/test').postMessage('raw from b3')

  b1.postMessage('helllo b1')

  console.log({
    hosts: IsomorphicBroadCastChannel.hosts
  })
  // b1.postMessage('helllo b1 1')
  // b1.postMessage('helllo b1 2')
  // b2.postMessage('helllo b2')
  // b2.postMessage('helllo b2 1')
  // b2.postMessage('helllo b2 2')
}


//#region @websql
function notifyBookUpdate(entityFn, idValue, property?, counter = 0) {
  if (property) {
    Firedev.Realtime.Server.TrigggerEntityPropertyChanges(Book, property, idValue);
  } else {
    Firedev.Realtime.Server.TrigggerEntityChanges(Book, idValue);
  }
  const name = CLASS.getName(entityFn);

  console.log(`notify enitty ${name} with id=${idValue}`
    + ` ${property ? ('and property "' + property + '"') : ''} (` + counter++ + ')');

  setTimeout(() => {
    notifyBookUpdate(entityFn, idValue, property, counter)
  }, 4444)
}
//#endregion


export default start;
//#endregion
