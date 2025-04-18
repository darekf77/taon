import { Taon } from 'taon/src';
import { QueryRunner } from 'taon-typeorm/src';
import { User } from '../app';

@Taon.Migration({
  className: 'MainContext_1735660080762_asd',
})
export class MainContext_1735660080762_asd extends Taon.Base.Migration {


  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
    const userRepo = await queryRunner.connection.getRepository(User);
    await userRepo.save(
      new User().clone({
        name: 'super-admin',
        age: 99,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
    const userRepo = await queryRunner.connection.getRepository(User);
    await userRepo.delete({ name: 'super-admin1' });
  }
}

@Taon.Migration({
  className: 'SecondContext_1735660080762_asd',
})
export class SecondContext_1735660080762_asd extends Taon.Base.Migration {
  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
    // console.log('SAVING!')
    const userRepo = await queryRunner.connection.getRepository(User);
    await userRepo.save(
      new User().clone({
        name: 'super-admin2',
        age: 99,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
    const userRepo = await queryRunner.connection.getRepository(User);
    await userRepo.delete({ name: 'super-admin' });
  }
}
