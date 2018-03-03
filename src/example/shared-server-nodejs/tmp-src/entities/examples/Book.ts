

import { Column  } from "typeorm/browser/decorator/columns/Column";
import { PrimaryGeneratedColumn  } from "typeorm/browser/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "typeorm/browser/decorator/entity/Entity";

import { Author } from "./Author";

@Entity(Book.name)
export class Book {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    author: Author;
}

export default Book;