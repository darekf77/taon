

import { Morphi } from 'morphi';


// local
import { Book } from '../../entities/examples/Book';


@Morphi.Controller({
  className: 'TestController',
  entity: Book
})
export class TestController extends Morphi.Base.Controller<Book> {

  //#region @backend
  async initExampleDbData() {
    await this.createBooks()
    // throw new Error("Method not implemented.");
  }
  //#endregion


  //#region @backend
  async createBooks() {

    let book1 = new Book();
    book1.title = 'aaaasdasd';
    let book2 = new Book();
    book2.title = 'aaaasdasd'
    this.repository.save([book1, book2] as any)
  }
  //#endregion
}
