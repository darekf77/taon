import { Column, Generated } from 'taon-typeorm/src';
import { _ } from 'tnp-core/src';

export {
  Repository,
  Connection,
  Generated,
  AfterInsert,
  AfterLoad,
  AfterRecover,
  AfterRemove,
  AfterSoftRemove,
  AfterUpdate,
  BeforeInsert,
  BeforeRecover,
  BeforeRemove,
  BeforeSoftRemove,
  BeforeUpdate,
  TreeChildren,
  TreeParent,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  VersionColumn,
  VirtualColumn,
  JoinTable,
  JoinColumn,
  OneToMany,
  OneToOne,
  ManyToMany,
  ManyToOne,
} from 'taon-typeorm/src';

export { Column as CustomColumn } from 'taon-typeorm/src';
export { Generated as GeneratedColumn } from 'taon-typeorm/src';
/**
 * 100 default characters varchar
 */
export const StringColumn = <T = string>(
  defaultValue: T = null,
  length = 100,
) =>
  Column({
    type: 'varchar',
    length,
    nullable: _.isNil(defaultValue),
    default: defaultValue,
  });

/**
 * 100 characters varchar
 */
export const String100Column = <T = string>(defaultValue: T = null) =>
  Column({
    type: 'varchar',
    length: 100,
    nullable: _.isNil(defaultValue),
    default: defaultValue,
  });

/**
 * 20 characters varchar
 */
export const String20Column = <T = string>(defaultValue: T = null) =>
  Column({
    type: 'varchar',
    length: 20,
    nullable: _.isNil(defaultValue),
    default: defaultValue,
  });

/**
 * 45 characters varchar
 */
export const String45Column = <T = string>(defaultValue: T = null) =>
  Column({
    type: 'varchar',
    length: 45,
    nullable: _.isNil(defaultValue),
    default: defaultValue,
  });

/**
 * 500 characters varchar
 */
export const String500Column = <T = string>(defaultValue: T = null) =>
  Column({
    type: 'varchar',
    length: 500,
    nullable: _.isNil(defaultValue),
    default: defaultValue,
  });

/**
 * 200 characters varchar
 */
export const String200Column = <T = string>(defaultValue: T = null) =>
  Column({
    type: 'varchar',
    length: 200,
    nullable: _.isNil(defaultValue),
    default: defaultValue,
  });

export const NumberColumn = () => Column({ type: 'int', nullable: true });

export const DecimalNumberColumn = () =>
  Column({ type: 'float', nullable: true });

export const SimpleJsonColumn = () =>
  Column({ type: 'simple-json', nullable: true });

export const BooleanColumn = (defaultValue: boolean | null) =>
  Column({ type: 'boolean', nullable: true, default: defaultValue });

export const DateTimeColumn = (defaultValue: boolean | null = null) =>
  Column({ type: 'datetime', nullable: true, default: defaultValue });
