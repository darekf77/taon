import { Column  } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn  } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";
// local
import { TestUser } from "./User";
import { CLASSNAME } from 'morphi';

@Entity(Author.name)
@CLASSNAME('Author')
export class Author {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int", { nullable: true })
    age: number;

    user: TestUser;

    friends: TestUser[];
}
