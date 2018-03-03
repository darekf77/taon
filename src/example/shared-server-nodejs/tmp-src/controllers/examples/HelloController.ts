

import {     ENDPOINT, GET, POST, PUT, DELETE, isNode,     PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,     Response, OrmConnection, Connection } from 'morphi/browser';

import { Repository } from "typeorm/browser";
// local
import { TestUser } from '../../entities/examples/User';
import { Book } from '../../entities/examples/Book';
import { Author } from '../../entities/examples/Author';
import { UsersController } from './UsersController';


const test = new TestUser();
test.username = 'Dariusz Filipiak brak ego';
test.books = [
    new Book()
]
test.friend = new Author();


console.log('life is amazing')

export function aaa() {

}

@ENDPOINT({ path: '/test' })
export class HelloController {
    @OrmConnection connection: Connection;
    private repository: Repository<TestUser>;
    user = new TestUser();
    constructor() {
        console.log('siema')
    }

    @PUT('/db/:id')
    modifyUser( @PathParam('id') id: number, @BodyParam('user') user): Response<any> {
return undefined;    }

    @GET('/db/:id', true)
    getUser( @PathParam('id') id: number): Response<TestUser> {
return undefined;    };

    @GET('/aaooaoaoa/test/:id', true)
    getUsersList( @PathParam('id') id: number): Response<TestUser[]> {
        console.log('test super')
return undefined;    };

    @DELETE('/db/:id')
    deleteUser( @PathParam('id') id: number): Response<any> {
return undefined;    };

    @GET('/:testing/basdasd/:foooo', true)
    getUserConfig( @PathParam('testing') test: string, @PathParam('foooo') booo: string): Response<any> {
return undefined;    }


    @POST('/user')
    saveUSer( @QueryParam('id_usera') id: number, @BodyParam() user): Response<any> {
return undefined;    }

    @PUT('/user/:id')
    updateUSer( @PathParam('id') id: number, @CookieParam('test_cookie', 112) testCookie): Response<any> {
return undefined;    }

}

export default HelloController;
