



import {     ENDPOINT, GET, POST, PUT, DELETE,     PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,     Response, BaseCRUD, BaseCRUDEntity, Connection, OrmConnection } from 'morphi/browser';

import { Repository } from "typeorm/browser";
// local
import { TestUser } from '../../entities/examples/User';


@ENDPOINT()
export class UsersController extends BaseCRUD<TestUser>
{

    @OrmConnection connection: Connection;
    @BaseCRUDEntity(TestUser) public entity: TestUser;
    private reposiotry: Repository<TestUser>;

    constructor() {
        super();

    }


}


export default UsersController;