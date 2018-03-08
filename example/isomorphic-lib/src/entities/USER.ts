import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";
import { AfterInsert } from "typeorm/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate";
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { Column } from "typeorm/decorator/columns/Column";
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";

//#region @backend
import { Router, Request, Response } from 'express';
import { authenticate } from "passport";
//#endregion

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
        //#region @backendFunc
        const User = await repo
            .createQueryBuilder(__(USER))
            .innerJoinAndSelect(`${__(USER)}.emails`, 'emails')
            .where(`${__(USER)}.username = :username`)
            .setParameter('username', username)
            .getOne()
        return User;
        //#endregion
    }

    public static async byId(id: number, repo: Repository<USER>) {
        //#region @backendFunc
        const User = await repo
            .createQueryBuilder(__(USER))
            .innerJoinAndSelect(`${__(USER)}.emails`, 'emails')
            .where(`${__(USER)}.id = :id`)
            .setParameter('id', id)
            .getOne()
        return User;
        //#endregion
    }
}


export default USER;
