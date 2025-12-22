import { Entity } from 'taon-typeorm/src'; // @websql
import { RelationPath } from 'taon-typeorm/src';

import { TaonBaseClass } from './base-class';

//#region @websql
@Entity()
//#endregion
export abstract class TaonBaseEntity<
  /**
   * type for cloning
   */
  CloneT extends TaonBaseClass = any,
> extends TaonBaseClass<CloneT> {
  /**
   * simple check if relation is ok
   */
  relation(relationName: RelationPath<CloneT>): string {
    return relationName as string;
  }

  /**
   * simple check if relation is ok
   */
  relations(relationNames: RelationPath<CloneT>[]): string[] {
    return relationNames as string[];
  }
}
