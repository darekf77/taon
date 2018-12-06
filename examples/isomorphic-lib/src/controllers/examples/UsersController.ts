

import {
    ENDPOINT, GET, POST, PUT, DELETE,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, Connection, OrmConnection, CLASSNAME
} from 'morphi';
import { Repository } from "typeorm";
// local
import { TestUser } from '../../entities/examples/User';


@ENDPOINT()
@CLASSNAME('UsersController')
export class UsersController extends BaseCRUD<TestUser>
{

    @OrmConnection connection: Connection;
    @BaseCRUDEntity(TestUser) public entity: TestUser;
    private reposiotry: Repository<TestUser>;

    constructor() {
        super();

    }


}
