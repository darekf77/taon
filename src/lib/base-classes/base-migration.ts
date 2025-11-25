import { MigrationInterface, QueryRunner } from 'taon-typeorm/src';
import { _ } from 'tnp-core/src';

import { ClassHelpers } from '../helpers/class-helpers';

import { TaonBaseInjector } from './base-injector';

export class TaonBaseMigration extends TaonBaseInjector implements MigrationInterface {
  /**
   * by default is READY to run
   */
  public isReadyToRun(): boolean {
    return true;
  }

  getDescription(): string {
    return _.startCase(ClassHelpers.getName(this));
  }

  async up(queryRunner: QueryRunner): Promise<any> {
    console.log(`[TaonBaseMigration] Running migration UP "${ClassHelpers.getName(this)}"`);
  }
  async down(queryRunner: QueryRunner): Promise<any> {
    console.log(`[TaonBaseMigration] Running migration DOWN "${ClassHelpers.getName(this)}"`);
  }
}
