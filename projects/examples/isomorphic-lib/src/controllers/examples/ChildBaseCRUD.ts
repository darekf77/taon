

import { Morphi } from 'morphi';
import { Book } from '../../entities/examples/Book';
import { TestController } from './TestController';
import { SYMBOL } from 'morphi/symbols';


@Morphi.Controller({
  className: 'ChildBaseCRUD',
  entity: Book
})
export class ChildBaseCRUD extends TestController {

  //#region @backend
  async initExampleDbData() {
    await this.createBooks()
  }
  //#endregion

  //#region @backend
  async createBooks() {

    let book1 = new Book();
    book1.title = 'overridedE!!!!';
    let book2 = new Book();
    book2.title = 'overririiriri1'
    this.repository.save([book1, book2] as any)
  }
  //#endregion


  @Morphi.Http.GET(`/${SYMBOL.CRUD_TABLE_MODEL}`)
  getAll(@Morphi.Http.Param.Query('config') config?: Morphi.CRUD.ModelDataConfig) {
    //#region @backendFunc
    console.log('here')
    return async (req, res) => {
      const s = super.getAll(config)
      const books = await Morphi.getResponseValue(s, req, res)
      const build = new Book();
      build.title = 'overirded!'
      return [
        build
      ].concat(books as any) as any
    }
    //#endregion
  }




}
