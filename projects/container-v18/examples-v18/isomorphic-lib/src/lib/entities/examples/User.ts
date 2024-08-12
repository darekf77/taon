import { Author } from "./Author";
import { Book } from "./Book";
import { Morphi } from 'morphi';

@Morphi.Entity()
export class TestUser {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  name: string;


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  username: string;

  friend: Author;

  books: Book[];

  public isAmazing() {
    return 'and super hero'
  }
}
