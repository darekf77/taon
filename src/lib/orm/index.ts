import * as tsorm from 'taon-typeorm/src';
import { _ } from 'tnp-core/src';

import * as additionalColumns from './columns';

export * from './columns';

// TODO new 5.8 typescript is not allowing this
// export namespace Orm {
//   export const Repository = tsorm.Repository;
//   export import Connection = tsorm.Connection;
//   export namespace ListenEvent {
//     export import AfterInsert = tsorm.AfterInsert;
//     export import AfterLoad = tsorm.AfterLoad;
//     export import AfterRecover = tsorm.AfterRecover;
//     export import AfterRemove = tsorm.AfterRemove;
//     export import AfterSoftRemove = tsorm.AfterSoftRemove;
//     export import AfterUpdate = tsorm.AfterUpdate;
//     export import BeforeInsert = tsorm.BeforeInsert;
//     export import BeforeRecover = tsorm.BeforeRecover;
//     export import BeforeRemove = tsorm.BeforeRemove;
//     export import BeforeSoftRemove = tsorm.BeforeSoftRemove;
//     export import BeforeUpdate = tsorm.BeforeUpdate;
//   }
//   export namespace Tree {
//     export import Children = tsorm.TreeChildren;
//     export import Parent = tsorm.TreeParent;
//   }
//   export namespace Column {
//     export import Generated = tsorm.PrimaryGeneratedColumn;
//     export import Primary = tsorm.PrimaryColumn;
//     export import Index = tsorm.Index;
//     export import CreateDate = tsorm.CreateDateColumn;
//     export import UpdateDate = tsorm.UpdateDateColumn;
//     export import DeleteDate = tsorm.DeleteDateColumn;
//     export import Custom = tsorm.Column;
//     export import String = additionalColumns.StringColumn;
//     export import String100 = additionalColumns.String100Column;
//     export import String45 = additionalColumns.String45Column;
//     export import String500 = additionalColumns.String500Column;
//     export import String200 = additionalColumns.String200Column;
//     export import Number = additionalColumns.NumberColumn;
//     export import DecimalNumber = additionalColumns.DecimalNumberColumn;
//     export import SimpleJson = additionalColumns.SimpleJsonColumn;
//     export import Boolean = additionalColumns.BooleanColumn;
//     export import DateTIme = additionalColumns.DateTImeColumn;
//     // TODO has limitation => comma in name
//     // export const SimpleArray = () => tsorm.Column({ type: 'simple-array', nullable: true });
//     export import Version = tsorm.VersionColumn;
//     export import Virtual = tsorm.VirtualColumn;
//   }
//   export namespace Join {
//     export import Table = tsorm.JoinTable;
//     export import Column = tsorm.JoinColumn;
//   }
//   export namespace Relation {
//     export import OneToMany = tsorm.OneToMany;
//     export import OneToOne = tsorm.OneToOne;
//     export import ManyToMany = tsorm.ManyToMany;
//     export import ManyToOne = tsorm.ManyToOne;
//   }
// }
