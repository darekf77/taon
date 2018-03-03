

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


import { EMAIL } from "./EMAIL";
import { __ } from '../helpers';

export type EMAIL_TYPE_NAME = 'normal_auth' | 'facebook' | 'google_plus' | 'twitter';


@Entity(__(EMAIL_TYPE))
export class EMAIL_TYPE {

    private constructor() {

    }

    @PrimaryGeneratedColumn()
    id: number;


    @Column({ length: 50, unique: true })
    name: EMAIL_TYPE_NAME;


    @ManyToMany(type => EMAIL, email => email.types, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    emails: EMAIL[] = [];

    public static async getBy(name: EMAIL_TYPE_NAME, repo: Repository<EMAIL_TYPE>) {
return undefined;    }

    public static async init(repo: Repository<EMAIL_TYPE>) {
return undefined;    }


    private static create(name: EMAIL_TYPE_NAME): EMAIL_TYPE {
        let t = new EMAIL_TYPE();
        t.name = name;
        return t;
    }

}

export default EMAIL_TYPE;