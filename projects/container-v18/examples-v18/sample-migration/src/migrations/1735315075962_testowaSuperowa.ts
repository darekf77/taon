import { QueryRunner } from 'taon-typeorm/src';
import { Taon } from 'taon/src';

@Taon.Migration({
  className: 'MainContext_1735315075962_testowaSuperowa',
})
export class MainContext_1735315075962_testowaSuperowa extends Taon.Base
  .Migration {
  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
  }
}

@Taon.Migration({
  className: 'SecondContext_1735315075962_testowaSuperowa',
})
export class SecondContext_1735315075962_testowaSuperowa extends Taon.Base
  .Migration {}
