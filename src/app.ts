//#region @notForNpm
import { _ } from 'tnp-core';
import { CLASS } from 'typescript-class-helpers';
import { Morphi } from './index';




@Morphi.Entity({ className: 'Student' })
class Student {
  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  public id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  public firstName: string

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  public lastName: string

}


@Morphi.Entity({ className: 'User' })
class User {
  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  public id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  public firstName: string

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar')
  //#endregion
  public lastName: string

}

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

@Morphi.Controller({ className: 'UserController' })
class UserController {
  @Morphi.Http.GET()
  helloWorld(): Morphi.Response<string> {
    return async (req, res) => {
      return 'hello world from here';
    }
  }
}

@Morphi.Controller({ className: 'StudentController', entity: Student })
class StudentController extends Morphi.Base.Controller<any>  {
  @Morphi.Http.GET()
  helloStudencie(): Morphi.Response<string> {
    return async (req, res) => {
      return 'hello world from here';
    }
  }
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

  @Morphi.Http.GET()
  helloWorld(): Morphi.Response<string> {
    return async (req, res) => {
      return 'hello world';
    }
  }
}

const host1 = `http://localhost:3111`;
const host2 = `http://localhost:3222`;

const start = async (port = 3000) => {

  const context1 = await Morphi.init({
    host: host1,
    controllers: [
      BookCtrl,
    ],
    entities: [
      Book,
      // User,
    ],
    //#region @backend
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
  if (Morphi.IsBrowser) {
    const c: BookCtrl = _.first(context1.controllers);
    const data = (await c.getAll().received).body.json as Book[];
    console.log('context 1', data);
  }

  const context2 = await Morphi.init({
    host: host2,
    controllers: [
      // BookCtrl,
      UserController,
      StudentController,
    ],
    entities: [
      User,
      Student,
      // Book,
    ],
    //#region @backend
    config: {
      type: "sqlite",
      database: 'tmp-db2.sqlite',
      synchronize: true,
      dropSchema: true,
      logging: false
    }
    //#endregion
  });

  // console.log(context);
  if (Morphi.IsBrowser) {
    const c: BookCtrl = _.first(context2.controllers);
    const data = (await c.getAll().received).body.json as Book[];
    console.log('context 2', data);
  }

  console.log('-------------');
  const { BaseCRUD } = await import('./lib/crud');
  console.log(`${BaseCRUD.name}: ${CLASS.getName(BaseCRUD)}`);
  const { BASE_CONTROLLER } = await import('./lib/framework');
  console.log(`${BASE_CONTROLLER.name}: ${CLASS.getName(BASE_CONTROLLER)}`);
  console.log(`${Student.name}: ${CLASS.getName(Student)}`);
  console.log(`${StudentController.name}: ${CLASS.getName(StudentController)}`);
  console.log(`${Book.name}: ${CLASS.getName(Book)}`);
  console.log(`${BookCtrl.name}: ${CLASS.getName(BookCtrl)}`);

}

if (Morphi.IsBrowser) {
  start()
}


export default start;
//#endregion
