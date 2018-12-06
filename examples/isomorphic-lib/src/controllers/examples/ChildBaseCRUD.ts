

import {
  ENDPOINT, GET, POST, PUT, DELETE, isNode,
  PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,
  Response, BaseCRUDEntity, OrmConnection, CLASSNAME,
  SYMBOL, ModelDataConfig
} from 'morphi';

import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";

// local
import { Book } from '../../entities/examples/Book';
import { TestController } from './TestController';


@ENDPOINT()
@CLASSNAME('ChildBaseCRUD')
export class ChildBaseCRUD extends TestController {
  @BaseCRUDEntity(Book) public entity: Book;
  constructor() {
    super();
    //#region @backend
    if (isNode) {
      this.createBooks()
    }
    //#endregion
  }

  //#region @backend
  async createBooks() {

    let book1 = new Book();
    book1.title = 'overridedE!!!!';
    let book2 = new Book();
    book2.title = 'overririiriri1'
    this.repository.save([book1, book2] as any)
  }

  @GET(`/${SYMBOL.CRUD_TABLE_MODEL}`)
  getAll(config?: ModelDataConfig) {
    console.log('here')
    return async () => {
      const build = new Book();
      return [{
        build
      }] as any;
    }
  }



  //#endregion
}
