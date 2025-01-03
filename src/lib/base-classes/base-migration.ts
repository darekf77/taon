import { _ } from 'tnp-core/src';
import { ClassHelpers } from '../helpers/class-helpers';
import { BaseInjector } from './base-injector';
import { MigrationInterface, QueryRunner } from 'taon-typeorm/src';

export class BaseMigration extends BaseInjector implements MigrationInterface {
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
    console.log(`[BaseMigration] Running migration UP "${ClassHelpers.getName(this)}"`);
  }
  async down(queryRunner: QueryRunner): Promise<any> {
    console.log(`[BaseMigration] Running migration DOWN "${ClassHelpers.getName(this)}"`);
  }
}
