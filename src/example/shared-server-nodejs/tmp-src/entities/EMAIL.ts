

import { Connection } from "typeorm/browser/connection/Connection";
import { Repository } from "typeorm/browser/repository/Repository";
import { AfterInsert } from "typeorm/browser/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/browser/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/browser/decorator/listeners/BeforeUpdate";
import { BeforeInsert } from "typeorm/browser/decorator/listeners/BeforeInsert";
import { OneToMany } from "typeorm/browser/decorator/relations/OneToMany";
import { OneToOne } from "typeorm/browser/decorator/relations/OneToOne";
import { ManyToMany } from "typeorm/browser/decorator/relations/ManyToMany";
import { ManyToOne } from "typeorm/browser/decorator/relations/ManyToOne";
import { JoinTable } from "typeorm/browser/decorator/relations/JoinTable";
import { JoinColumn } from "typeorm/browser/decorator/relations/JoinColumn";
import { Column } from "typeorm/browser/decorator/columns/Column";
import { CreateDateColumn } from "typeorm/browser/decorator/columns/CreateDateColumn";
import { PrimaryColumn } from "typeorm/browser/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/browser/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/browser/decorator/entity/Entity";


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
return undefined;    }

}

export default EMAIL;