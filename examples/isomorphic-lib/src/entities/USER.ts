
//#region @backend
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";
//#endregion

import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";
import { Morphi } from 'morphi';


export interface IUSER {
  email?: string;
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  city?: string;
}


@Morphi.Entity()
export class USER implements IUSER {

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  session: SESSION;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  username: string;

  //#region @backend
  @Morphi.Orm.Column.Custom()
  //#endregion
  password: string;


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  firstname: string;


  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  lastname: string;

  //#region @backend
  @Morphi.Orm.Column.Custom({ nullable: true })
  //#endregion
  email?: string;

  //#region @backend
  @Morphi.Orm.Relation.OneToMany(type => EMAIL, email => email.user, {
    cascade: false
  })
  //#endregion
  emails: EMAIL[];

  public static async byUsername(username: string, repo: Morphi.Orm.Repository<USER>) {
    //#region @backendFunc
    const User = await repo
      .createQueryBuilder(Morphi.Orm.TableNameFrom(USER))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(USER)}.emails`, 'emails')
      .where(`${Morphi.Orm.TableNameFrom(USER)}.username = :username`)
      .setParameter('username', username)
      .getOne()
    return User;
    //#endregion
  }

  public static async byId(id: number, repo: Morphi.Orm.Repository<USER>) {
    //#region @backendFunc
    const User = await repo
      .createQueryBuilder(Morphi.Orm.TableNameFrom(USER))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(USER)}.emails`, 'emails')
      .where(`${Morphi.Orm.TableNameFrom(USER)}.id = :id`)
      .setParameter('id', id)
      .getOne()
    return User;
    //#endregion
  }
}

