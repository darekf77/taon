import { MyEntity } from './my-entity';
import type { MyEntityController } from './my-entity.controller';

/**
 * Backend methods for MyEntity
 *
 * + use entites injected controllers to access other backends
 * + don't use controllers methods/properties here
 */
export class MyEntityBackend {
  //#region initialization
  public static for(ctrl: MyEntityController) { return new MyEntityBackend(ctrl); }
  private get repo() {
    return this.ctrl.repository;
  }
  private constructor(private ctrl: MyEntityController) { }
  //#endregion

  async countEntities() {
    await this.ctrl.repository.count();
  }

  async initExampleDbData() {
    // await this.repo.save(MyEntity.from({ description: 'hello world' }))
    // const all = await this.repo.find()
  }

}
