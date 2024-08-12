import { Author } from "./Author";
import { Morphi } from 'morphi';

@Morphi.Entity()
export class Book {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;


  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  title: string;

  author: Author;
}
