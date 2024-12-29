import { ClassHelpers } from '../helpers/class-helpers';
import { BaseInjector } from './base-injector';
import { MigrationInterface, QueryRunner } from 'taon-typeorm/src';

export  class BaseMigration
  extends BaseInjector
  implements MigrationInterface
{
  async up(queryRunner: QueryRunner): Promise<any> {
    console.log(`Running migration UP "${ClassHelpers.getName(this)}"`);
  }
  async down(queryRunner: QueryRunner): Promise<any> {
    console.log(`Running migration DOWN "${ClassHelpers.getName(this)}"`);
  }
}
