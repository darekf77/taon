import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";
import { AfterInsert } from "typeorm/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate";
import { BeforeInsert } from "typeorm/decorator/listeners/BeforeInsert";
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { OneToOne } from "typeorm/decorator/relations/OneToOne";
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn";
import { Column } from "typeorm/decorator/columns/Column";
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn";
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";

//#region @backend
import { Router, Request, Response } from "express";
//#endregion

import { USER } from "./USER";
import { EMAIL_TYPE } from './EMAIL_TYPE';

import { __ } from '../helpers';

@Entity(__(EMAIL))
export class EMAIL {

    constructor(address: string) {
        this.address = address;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 100, unique: true })
    address: string;


    @ManyToMany(type => EMAIL_TYPE, type => type.emails, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    @JoinTable()
    types: EMAIL_TYPE[] = [];


    @ManyToOne(type => USER, user => user.id, {
        cascadeAll: false
    })
    @JoinColumn()
    user: USER;


    public static async getUser(address: string, repo: Repository<EMAIL>) {
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

export default EMAIL;