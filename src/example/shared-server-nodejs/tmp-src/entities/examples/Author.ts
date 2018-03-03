

import { Column  } from "typeorm/browser/decorator/columns/Column";
import { PrimaryGeneratedColumn  } from "typeorm/browser/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/browser/decorator/entity/Entity";
// local
import { TestUser } from "./User";

@Entity(Author.name)
export class Author {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { nullable: true })
    age: number;

    user: TestUser;

    friends: TestUser[];
}

export default Author;