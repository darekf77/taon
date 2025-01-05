import { Taon } from 'taon/src';
import { QueryRunner } from 'taon-typeorm/src';

@Taon.Migration({
  className: 'MainContext_1736036594134_nowaJakas',
})
export class MainContext_1736036594134_nowaJakas extends Taon.Base.Migration {
  /**
   * remove this method if you are ready to run this migration
   */
  public isReadyToRun(): boolean {
    return false;
  }

  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
  }
}

@Taon.Migration({
  className: 'SecondContext_1736036594134_nowaJakas',
})
export class SecondContext_1736036594134_nowaJakas extends Taon.Base.Migration {
  /**
   * remove this method if you are ready to run this migration
   */
  public isReadyToRun(): boolean {
    return false;
  }

  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
  }
}
