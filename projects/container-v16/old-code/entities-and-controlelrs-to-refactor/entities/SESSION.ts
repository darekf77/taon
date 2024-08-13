//#region @backend
import { generate } from "password-hash";
//#endregion

import { Resource } from "ng2-rest";
import { Morphi } from 'morphi';
import { USER } from './USER';


@Morphi.Entity()
export class SESSION {

  private static get const() {
    return {
      SESSION_TIME_SECONDS: 3600,
      SESSION_LOCAL_STORAGE: 'session-isomorphic-rest',
      AUTHORIZATION_HEADER: 'Authorization'
    }
  }

  private constructor() { }

  expireInSeconds: number;
  calculateExpirationTime(): number {
    const now = new Date();
    return Math.round((this.expiredDate.getTime() - now.getTime()) / 1000);
  }

  //#region @backend
  @Morphi.Orm.Column.Generated()
  //#endregion
  id: number;

  //#region @backend
  @Morphi.Orm.Column.Custom({ length: 100 })
  //#endregion
  token: string;

  token_type = 'bearer';

  //#region @backend
  @Morphi.Orm.Column.Custom({
    length: 50,
    nullable: true
  })
  ip: string;

  //#region @backend
  @Morphi.Orm.Column.CreateDate()
  //#endregion
  createdDate: Date;

  //#region @backend
  @Morphi.Orm.Column.Custom({
    nullable: false
  })
  //#endregion
  expiredDate: Date;


  //#region @backend
  @Morphi.Orm.Relation.OneToOne(type => USER, user => user.id, {
    nullable: true
  })
  @Morphi.Orm.Join.Column()
  //#endregion
  user: USER;

  private createToken(token?: string) {
    //#region @backend
    this.createdDate = new Date();
    const timestamp = this.createdDate.getTime();
    this.token = token ? token : Morphi.Auth.Password.Hash.Generate(this.user.id + timestamp + this.ip)
    this.expiredDate = new Date(timestamp + SESSION.const.SESSION_TIME_SECONDS * 1000)
    //#endregion
  }

  isExpired(when: Date = new Date()) {
    let time = {
      expire: this.expiredDate.getTime(),
      now: when.getTime()
    }
    return (time.expire < time.now);
  }

  public saveInLocalStorage() {
    let session: SESSION = this;
    window.localStorage.setItem(SESSION.const.SESSION_LOCAL_STORAGE, JSON.stringify(session));
  }

  public static fromLocalStorage(): SESSION {
    let session: SESSION = new SESSION();
    try {
      const data = window.localStorage.getItem(SESSION.const.SESSION_LOCAL_STORAGE);
      const s = JSON.parse(data) as SESSION;
      session.token = s.token;
      session.token_type = s.token_type;
      session.expiredDate = new Date(s.expiredDate as any);
    } catch {
      session = undefined;
    }
    return session;
  }

  public static removeFromLocalStorage() {
    window.localStorage.removeItem(SESSION.const.SESSION_LOCAL_STORAGE);
  }

  public activateBrowserToken() {
    const session: SESSION = this;
    Resource.Headers.request.set(SESSION.const.AUTHORIZATION_HEADER,
      `${session.token_type} ${session.token}`)
  }

  public static async getByUser(user: USER, ip: string, repo: Morphi.Orm.Repository<SESSION>) {
    //#region @backendFunc
    const Session = await repo.createQueryBuilder(Morphi.Orm.TableNameFrom(SESSION))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(SESSION)}.user`, Morphi.Orm.TableNameFrom(USER))
      .where(`${Morphi.Orm.TableNameFrom(SESSION)}.user = :id`)
      .andWhere(`${Morphi.Orm.TableNameFrom(SESSION)}.ip = :ip`)
      .setParameters({
        id: user.id,
        ip
      })
      .getOne()
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;
    //#endregion
  }
  public static async getByToken(token: string, repo: Morphi.Orm.Repository<SESSION>) {
    //#region @backendFunc
    const Session = await repo.createQueryBuilder(Morphi.Orm.TableNameFrom(SESSION))
      .innerJoinAndSelect(`${Morphi.Orm.TableNameFrom(SESSION)}.user`, Morphi.Orm.TableNameFrom(USER))
      .where(`${Morphi.Orm.TableNameFrom(SESSION)}.token = :token`)
      .setParameter('token', token)
      .getOne();
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;
    //#endregion
  }

  public static async create(user: USER, ip: string, repo: Morphi.Orm.Repository<SESSION>) {
    //#region @backendFunc
    let Session = new SESSION();
    Session.user = user;
    Session.ip = ip;

    Session.createToken(user.username == 'postman' ? 'postman' : undefined);

    Session = await repo.save(Session);
    if (Session) {
      Session.expireInSeconds = Session.calculateExpirationTime();
    }
    return Session;
    //#endregion
  }

}

