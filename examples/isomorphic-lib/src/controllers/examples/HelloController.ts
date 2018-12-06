import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, OrmConnection, Connection, CLASSNAME
} from 'morphi';
import { Repository } from 'typeorm';
// local
import { TestUser } from '../../entities/examples/User';
import { Book } from '../../entities/examples/Book';
import { Author } from '../../entities/examples/Author';
import { UsersController } from './UsersController';


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

@ENDPOINT({ path: '/test' })
@CLASSNAME('HelloController')
export class HelloController {
    @OrmConnection connection: Connection;
    private repository: Repository<TestUser>;
    user = new TestUser();
    constructor() {
        console.log('siema');
        //#region @backend
        if (isNode) {
            console.log('I am in the contructor of HelloController !!', this.connection);
            // console.log('Pizda in constr', this['pizda'])
            this.repository = this.connection.getRepository(TestUser) as any;
            const user = new TestUser();
            user.username = 'Dariusz Filipiak is programmer';
            user.books = [
                new Book()
            ];
            user.friend = new Author();
            this.repository.save(user);
        }
        //#endregion
    }

    @PUT('/db/:id')
    modifyUser( @PathParam('id') id: number, @BodyParam('user') user): Response<any> {
        //#region @backendFunc
        test.username = user.username;
        return { send: test };
        //#endregion
    }

    @GET('/db/:id', true)
    getUser( @PathParam('id') id: number): Response<TestUser> {
        //#region @backendFunc
        // return { send: test }

        return async (req, res) => {
            const user = await this.repository.findOne({});
            return user;
        };
        //#endregion
    }

    @GET('/aaooaoaoa/test/:id', true)
    getUsersList( @PathParam('id') id: number): Response<TestUser[]> {
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

    @DELETE('/db/:id')
    deleteUser( @PathParam('id') id: number): Response<any> {
        //#region @backendFunc
        return { send: test };
        //#endregion
    }

    @GET('/:testing/basdasd/:foooo', true)
    getUserConfig( @PathParam('testing') ptest: string, @PathParam('foooo') booo: string): Response<any> {
        //#region @backendFunc
        console.log('I am original method');
        return { send: ptest };
        //#endregion
    }


    @POST('/user')
    saveUSer( @QueryParam('id_usera') id: number, @BodyParam() user): Response<any> {
        //#region @backendFunc
        return { send: { id, user } };
        //#endregion
    }

    @PUT('/user/:id')
    updateUSer( @PathParam('id') id: number, @CookieParam('test_cookie', 112) testCookie): Response<any> {
        //#region @backendFunc
        return { send: { id, testCookie } };
        //#endregion
    }

}
