import { EMAIL } from "./EMAIL";
import { Morphi } from 'morphi';

export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';


@Morphi.Entity()
export class EMAIL_TYPE {

  private constructor() {

  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom({ length: 50, unique: true })
  //#endregion
  name: EMAIL_TYPE_NAME;


  //#region @backend
  @Morphi.Orm.Relation.ManyToMany(type => EMAIL, email => email.types, {
    cascade: false
  })
  //#endregion
  emails: EMAIL[];

  public static async getBy(name: EMAIL_TYPE_NAME, repo: Morphi.Orm.Repository<EMAIL_TYPE>) {
    //#region @backendFunc
    const etype = await repo.findOne({
      where: {
        name
      }
    })
    return etype;
    //#endregion
  }

  public static async init(repo:  Morphi.Orm.Repository<EMAIL_TYPE>) {
    //#region @backendFunc
    const types = [
      await repo.save(EMAIL_TYPE.create('facebook')),
      await repo.save(EMAIL_TYPE.create('normal_auth')),
      await repo.save(EMAIL_TYPE.create('twitter')),
      await repo.save(EMAIL_TYPE.create('google_plus'))
    ];
    return types;
    //#endregion
  }


  private static create(name: EMAIL_TYPE_NAME): EMAIL_TYPE {
    let t = new EMAIL_TYPE();
    t.name = name;
    return t;
  }

}
