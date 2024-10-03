//#region imports
import { Taon } from 'taon/src';
import type { MyEntity } from '../my-entity';

//#endregion

@Taon.Controller()
export class MyEntitySubscriber implements Taon.Base.AbstractEntity {

  /**
  * Called after entity update.
  */
  // afterUpdate(event: UpdateEvent<MyEntity>) {
  //   console.log(`AFTER ENTITY UPDATED: `, event.entity)
  // }

}
