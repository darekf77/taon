

import { Connection } from "typeorm/browser/connection/Connection";
import { Repository } from "typeorm/browser/repository/Repository";
import { AfterInsert } from "typeorm/browser/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/browser/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/browser/decorator/listeners/BeforeUpdate";
import { OneToMany } from "typeorm/browser/decorator/relations/OneToMany";
import { ManyToMany } from "typeorm/browser/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/browser/decorator/relations/JoinTable";
import { Column } from "typeorm/browser/decorator/columns/Column";
import { PrimaryColumn } from "typeorm/browser/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/browser/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/browser/decorator/entity/Entity";


import { SESSION } from "./SESSION";
import { EMAIL } from "./EMAIL";
import { EMAIL_TYPE_NAME } from "./EMAIL_TYPE";
import { __ } from '../helpers';

export interface IUSER {
    email?: string;
    username: string;
    password: string;
    firstname?: string;
    lastname?: string;
    city?: string;
}


@Entity(__(USER))
export class USER implements IUSER {

    @PrimaryGeneratedColumn()
    id: number;

    session: SESSION;

    @Column() username: string;
    @Column() password: string;
    @Column({ nullable: true }) firstname: string;
    @Column({ nullable: true }) lastname: string;
    @Column({ nullable: true }) email?: string;

    @OneToMany(type => EMAIL, email => email.user, {
        cascadeUpdate: false,
        cascadeInsert: false
    })
    emails: EMAIL[] = [];

    public static async byUsername(username: string, repo: Repository<USER>) {
return undefined;    }

    public static async byId(id: number, repo: Repository<USER>) {
return undefined;    }
}


export default USER;