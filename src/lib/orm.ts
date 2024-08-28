//#region @websql
import * as tsorm from 'taon-typeorm/src';
//#endregion

//#region orm
export namespace Orm {
  //#region @websql
  export const Repository = tsorm.Repository;
  export import Connection = tsorm.Connection;
  export namespace ListenEvent {
    export import AfterInsert = tsorm.AfterInsert;
    export import AfterLoad = tsorm.AfterLoad;
    export import AfterRecover = tsorm.AfterRecover;
    export import AfterRemove = tsorm.AfterRemove;
    export import AfterSoftRemove = tsorm.AfterSoftRemove;
    export import AfterUpdate = tsorm.AfterUpdate;
    export import BeforeInsert = tsorm.BeforeInsert;
    export import BeforeRecover = tsorm.BeforeRecover;
    export import BeforeRemove = tsorm.BeforeRemove;
    export import BeforeSoftRemove = tsorm.BeforeSoftRemove;
    export import BeforeUpdate = tsorm.BeforeUpdate;
  }

  export namespace Tree {
    export import Children = tsorm.TreeChildren;
    export import Parent = tsorm.TreeParent;
  }
  export namespace Column {
    export import Generated = tsorm.PrimaryGeneratedColumn;
    export import Primary = tsorm.PrimaryColumn;
    export import Index = tsorm.Index;
    export import CreateDate = tsorm.CreateDateColumn;
    export import UpdateDate = tsorm.UpdateDateColumn;
    export import DeleteDate = tsorm.DeleteDateColumn;
    export import Custom = tsorm.Column;

    /**
     * 100 characters varchar
     */
    export const String = () =>
      tsorm.Column({ type: 'varchar', length: 100, nullable: true });

    export const Number = () =>
      tsorm.Column({ type: 'int',  nullable: true });

    export const DecimalNumber = () =>
      tsorm.Column({ type: 'float',  nullable: true });


    export const SimpleJson = () =>
      tsorm.Column({ type: 'simple-json', nullable: true });

    export const Boolean = (defaultValue: boolean) =>
      tsorm.Column({ type: 'boolean', default: defaultValue });

    // TODO has limitation => comma in name
    // export const SimpleArray = () => tsorm.Column({ type: 'simple-array', nullable: true });
    export import Version = tsorm.VersionColumn;
    export import Virtual = tsorm.VirtualColumn;
  }

  export namespace Join {
    export import Table = tsorm.JoinTable;
    export import Column = tsorm.JoinColumn;
  }
  export namespace Relation {
    export import OneToMany = tsorm.OneToMany;
    export import OneToOne = tsorm.OneToOne;
    export import ManyToMany = tsorm.ManyToMany;
    export import ManyToOne = tsorm.ManyToOne;
  }
  //#endregion
}

//#endregion
