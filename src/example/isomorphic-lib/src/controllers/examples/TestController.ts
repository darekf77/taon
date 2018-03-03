

import {
    ENDPOINT, GET, POST, PUT, DELETE, isNode,
    PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
    Response, BaseCRUD, BaseCRUDEntity, OrmConnection
} from 'morphi';

import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";

// local
import { Book } from '../../entities/examples/Book';


@ENDPOINT()
export class TestController extends BaseCRUD<Book> {
    @BaseCRUDEntity(Book) public entity: Book;
    constructor() {
        super();
        if (isNode) {
            this.createBooks()
        }
    }

    async createBooks() {
        let book1 = new Book();
        book1.title = 'aaaasdasd'
        let book2 = new Book();
        book2.title = 'aaaasdasd'
        this.repository.save([book1, book2] as any)
    }
}


export default TestController;