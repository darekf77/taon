
import { TestUser } from "./User";
import { Morphi } from 'morphi';

@Morphi.Entity()
export class Author {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom("int", { nullable: true })
  //#endregion
  age: number;

  user: TestUser;

  friends: TestUser[];
}
