import { Column  } from "typeorm/decorator/columns/Column";
import { PrimaryGeneratedColumn  } from "typeorm/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/decorator/entity/Entity";

import { Author } from "./Author";
import { CLASSNAME } from 'morphi';

@Entity(Book.name)
@CLASSNAME('Book')
export class Book {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    author: Author;
}
