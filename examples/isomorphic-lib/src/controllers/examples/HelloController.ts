import { Morphi } from 'morphi';
// local
import { TestUser } from '../../entities/examples/User';
import { Book } from '../../entities/examples/Book';
import { Author } from '../../entities/examples/Author';
import { UsersController } from './UsersController';
import { USER } from '../../entities/USER';


const test = new TestUser();
test.username = 'Dariusz Filipiak brak ego';
test.books = [
  new Book()
];
test.friend = new Author();

//#region @backend
enum USER_GROUPS {
  ADMIN, USER, USER_PREMIU
}
//#endregion

console.log('life is amazing');

export function aaa() {

}

@Morphi.Controller({
  path: '/test',
  className: 'HelloController',
  entity: TestUser
})
export class HelloController extends Morphi.Base.Controller<TestUser> {
  user = new TestUser();

  //#region @backend
  async initExampleDbData() {
    console.log('I am in the contructor of HelloController !!', this.connection);
    // console.log('Pizda in constr', this['pizda'])
    const user = new TestUser();
    user.username = 'Dariusz Filipiak is programmer';
    user.books = [
      new Book()
    ];
    user.friend = new Author();
    this.repository.save(user);
  }
  //#endregion

  @Morphi.Http.PUT('/db/:id')
  modifyUser(@Morphi.Http.Param.Path('id') id: number,
    @Morphi.Http.Param.Body('user') user): Morphi.Response<any> {
    //#region @backendFunc
    test.username = user.username;
    return { send: test };
    //#endregion
  }

  @Morphi.Http.GET('/db/:id', true)
  getUser(@Morphi.Http.Param.Path('id') id: number): Morphi.Response<TestUser> {
    //#region @backendFunc
    // return { send: test }

    return async (req, res) => {
      const user = await this.repository.findOne({});
      return user;
    };
    //#endregion
  }

  @Morphi.Http.GET('/aaooaoaoa/test/:id', true)
  getUsersList(@Morphi.Http.Param.Path('id') id: number): Morphi.Response<TestUser[]> {
    console.log('test super');
    //#region @backendFunc
    return {
      send: (req, res) => {
        res.set('aaaaaa', 'bbbb');
        return [test, test];
      }
    };
    //#endregion
  }

  @Morphi.Http.DELETE('/db/:id')
  deleteUser(@Morphi.Http.Param.Path('id') id: number): Morphi.Response<any> {
    //#region @backendFunc
    return { send: test };
    //#endregion
  }

  @Morphi.Http.GET('/:testing/basdasd/:foooo', true)
  getUserConfig(@Morphi.Http.Param.Path('testing') ptest: string, @Morphi.Http.Param.Path('foooo') booo: string): Morphi.Response<any> {
    //#region @backendFunc
    console.log('I am original method');
    return { send: ptest };
    //#endregion
  }


  @Morphi.Http.POST('/user')
  saveUSer(@Morphi.Http.Param.Query('id_usera') id: number, @Morphi.Http.Param.Body() user): Morphi.Response<any> {
    //#region @backendFunc
    return { send: { id, user } };
    //#endregion
  }

  @Morphi.Http.PUT('/user/:id')
  updateUSer(@Morphi.Http.Param.Path('id') id: number, @Morphi.Http.Param.Cookie('test_cookie', 112) testCookie): Morphi.Response<any> {
    //#region @backendFunc
    return { send: { id, testCookie } };
    //#endregion
  }

}
