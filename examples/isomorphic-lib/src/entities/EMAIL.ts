
import { USER } from "./USER";
import { EMAIL_TYPE } from './EMAIL_TYPE';
import { Morphi } from 'morphi';

@Morphi.Entity()
export class EMAIL {

  constructor(address: string) {
    this.address = address;
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom('varchar', { length: 100, unique: true })
  //#endregion
  address: string;


  //#region @backend
  @Morphi.Orm.Relation.ManyToMany(type => EMAIL_TYPE, type => type.emails, {
    cascade: false
  })
  @Morphi.Orm.Join.Table()
  //#endregion
  types: EMAIL_TYPE[];

  //#region @backend
  @Morphi.Orm.Relation.ManyToOne(type => USER, user => user.id, {
    cascade: false
  })
  @Morphi.Orm.Join.Column()
  //#endregion
  user: USER;


  public static async getUser(address: string, repo: Morphi.Orm.Repository<EMAIL>) {
    //#region @backendFunc
    const Email = await repo.findOne({
      where: {
        address
      }
    });
    if (Email) return Email.user;
    //#endregion
  }

}
