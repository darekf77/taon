//#region @notForNpm
import { _ } from 'tnp-core';
import { CLASS } from 'typescript-class-helpers';
import { Morphi as Firedev } from './index';

//#region @browser
import { NgModule, Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
//#endregion


const host1 = `http://localhost:3111`;
const host2 = `http://localhost:3222`;
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

@Firedev.Entity({ className: 'Book' })
class Book extends Firedev.Base.Entity<any> {
  static from(name: string) {
    const b = new Book();
    b.name = name;
    return b;
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

@Firedev.Controller({ className: 'UserController' })
class UserController {
  @Firedev.Http.GET()
  helloWorld(): Firedev.Response<string> {
    return async (req, res) => {
      return 'hello world from here';
    }
  }
}

@Firedev.Controller({ className: 'StudentController', entity: Student })
class StudentController extends Firedev.Base.Controller<any>  {
  @Firedev.Http.GET()
  helloStudencie(): Firedev.Response<string> {
    return async (req, res) => {
      return 'hello world from here';
    }
  }
}




//#region @browser
@Component({
  selector: 'app-morphi',
  template: `
hello world

  `
})
export class MorphiComponent implements AfterViewInit {

  loadedSqlJs = Firedev.loadedSqlJs().subscribe(() => {
    Firedev.initNgZone(this.ngzone);
    start();
  });

  constructor(
    private ngzone: NgZone
  ) { }

  async ngAfterViewInit() {

    console.log('INITED ')
  }
}

@NgModule({
  imports: [],
  exports: [MorphiComponent],
  declarations: [MorphiComponent],
})
export class MorphiModule { }
//#endregion


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
}



const start = async () => {

  const context1 = await Firedev.init({
    host: host1,
    controllers: [
      BookCtrl,
    ],
    entities: [
      Book,
      // User,
    ],
    //#region @websql
    config: {
      type: "sqlite",
      database: 'tmp-db1.sqlite',
      synchronize: true,
      dropSchema: true,
      logging: false
    }
    //#endregion
  });

  // console.log(context);
  // if (Firedev.IsBrowser) {
  //   const c: BookCtrl = _.first(context1.controllers);
  //   const data = (await c.getAll().received).body.json as Book[];
  //   console.log('context 1', data);
  // }

  // const context2 = await Firedev.init({
  //   host: host2,
  //   controllers: [
  //     BookCtrl,
  //     // UserController,
  //     // StudentController,
  //   ],
  //   entities: [
  //     // User,
  //     // Student,
  //     Book,
  //   ],
  //   //#region @websql
  //   config: { // @ts-ignore
  //     type: "better-sqlite3",
  //     database: 'tmp-db2.sqlite',
  //     synchronize: true,
  //     dropSchema: true,
  //     logging: false
  //   }
  //   //#endregion
  // });

  // // console.log(context);
  // if (Firedev.IsBrowser) {
  //   const c: BookCtrl = _.first(context2.controllers);
  //   const data = (await c.getAll().received).body.json as Book[];
  //   console.log('context 2', data);


  //   let i = 0;
  //   Firedev.Realtime.Browser.listenChangesEntity(Book, 1).subscribe(() => {
  //     console.log(`realtime update of Book with id=1 (` + i++ + ')')
  //   })

  //   let j = 0

  //   Firedev.Realtime.Browser.listenChangesEntity(Book, 2, { property: 'name' }).subscribe((d) => {
  //     console.log('realtime update of Book with id 2 for property "name" (' + j++ + ')', d)
  //   });

  //   // Firedev.Realtime.Browser.SubscribeEntity<Book>(Book, 2, (value) => {
  //   //   console.log('realtime update of Book with id 2 for property "name" (' + j++ + ')')
  //   // }, 'name')

  //   // book.subscribeRealtimeUpdates({
  //   //   callback: (b) => {
  //   //     console.log('realtime update', b)
  //   //   }
  //   // })

  // }

  // // console.log('-------------');
  // // const { BaseCRUD } = await import('./lib/crud');
  // // console.log(`${BaseCRUD.name}: ${CLASS.getName(BaseCRUD)}`);
  // // const { BASE_CONTROLLER } = await import('./lib/framework');
  // // console.log(`${BASE_CONTROLLER.name}: ${CLASS.getName(BASE_CONTROLLER)}`);
  // // console.log(`${Student.name}: ${CLASS.getName(Student)}`);
  // // console.log(`${StudentController.name}: ${CLASS.getName(StudentController)}`);
  // // console.log(`${Book.name}: ${CLASS.getName(Book)}`);
  // // console.log(`${BookCtrl.name}: ${CLASS.getName(BookCtrl)}`);

  // //#region @websql
  // notifyBookUpdate(Book, 1);
  // notifyBookUpdate(Book, 2, 'name');

  // //#endregion

}


//#region @websql

// function notifyBookUpdate(entityFn, idValue, property?, counter = 0) {
//   if (property) {
//     Firedev.Realtime.Server.TrigggerEntityPropertyChanges(Book, property, idValue);
//   } else {
//     Firedev.Realtime.Server.TrigggerEntityChanges(Book, idValue);
//   }
//   const name = CLASS.getName(entityFn);

//   console.log(`notify enitty ${name} with id=${idValue}`
//     + ` ${property ? ('and property "' + property + '"') : ''} (` + counter++ + ')');

//   setTimeout(() => {
//     notifyBookUpdate(entityFn, idValue, property, counter)
//   }, 4444)
// }
//#endregion


export default start;
//#endregion
