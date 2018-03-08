import { Connection } from "typeorm/connection/Connection";
import { Repository } from "typeorm/repository/Repository";
import { AfterInsert } from "typeorm/decorator/listeners/AfterInsert";
import { AfterUpdate } from "typeorm/decorator/listeners/AfterUpdate";
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate";
import { BeforeInsert } from "typeorm/decorator/listeners/BeforeInsert";
import { OneToMany } from "typeorm/decorator/relations/OneToMany";
import { OneToOne } from "typeorm/decorator/relations/OneToOne";
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany";
import { JoinTable } from "typeorm/decorator/relations/JoinTable";
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn";
import { Column } from "typeorm/decorator/columns/Column";
import { CreateDateColumn } from "typeorm/decorator/columns/CreateDateColumn";
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn";
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";


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
        //#region @backendFunc
        const etype = await repo.findOne({
            where: {
                name
            }
        })
        return etype;
        //#endregion
    }

    public static async init(repo: Repository<EMAIL_TYPE>) {
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

export default EMAIL_TYPE;