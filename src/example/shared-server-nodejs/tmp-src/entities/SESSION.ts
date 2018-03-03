

import { Connection } from "typeorm/browser/connection/Connection";
import { Repository } from "typeorm/browser/repository/Repository";
import { AfterInsert } from "typeorm/browser/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/browser/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/browser/decorator/listeners/BeforeUpdate";
import { BeforeInsert } from "typeorm/browser/decorator/listeners/BeforeInsert";
import { OneToMany } from "typeorm/browser/decorator/relations/OneToMany";
import { OneToOne } from "typeorm/browser/decorator/relations/OneToOne";
import { ManyToMany } from "typeorm/browser/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/browser/decorator/relations/JoinTable";
import { JoinColumn } from "typeorm/browser/decorator/relations/JoinColumn";
import { Column } from "typeorm/browser/decorator/columns/Column";
import { CreateDateColumn } from "typeorm/browser/decorator/columns/CreateDateColumn";
import { PrimaryColumn } from "typeorm/browser/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/browser/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/browser/decorator/entity/Entity";

import { verify, generate } from "password-hash";


// local
import { Log, Level } from "ng2-logger/browser";
import { Resource } from "ng2-rest/browser";
const log = Log.create(__filename);

import { USER } from './USER';
import { __ } from '../helpers';



@Entity(__(SESSION))
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

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    token: string;

    token_type = 'bearer';

    @Column({
        length: 50,
        nullable: true
    })
    ip: string;

    @CreateDateColumn()
    createdDate: Date;

    @Column({
        nullable: false
    })
    expiredDate: Date;

    @OneToOne(type => USER, user => user.id, {
        nullable: true
    })
    @JoinColumn()
    user: USER;

    private createToken(token?: string) {
        this.createdDate = new Date();
        const timestamp = this.createdDate.getTime();
        this.token = token ? token : generate(this.user.id + timestamp + this.ip)
        this.expiredDate = new Date(timestamp + SESSION.const.SESSION_TIME_SECONDS * 1000)
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

    public static async getByUser(user: USER, ip: string, repo: Repository<SESSION>) {
return undefined;    }
    public static async getByToken(token: string, repo: Repository<SESSION>) {
return undefined;    }

    public static async create(user: USER, ip: string, repo: Repository<SESSION>) {
return undefined;    }

}


export default SESSION;
