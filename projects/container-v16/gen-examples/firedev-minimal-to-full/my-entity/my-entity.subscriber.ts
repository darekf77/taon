//#region imports
import { Firedev } from 'firedev/src';
import type { MyEntity } from '../my-entity';

//#endregion

@Firedev.Controller()
export class MyEntitySubscriber implements Firedev.Base.AbstractEntity {

  /**
  * Called after entity update.
  */
  // afterUpdate(event: UpdateEvent<MyEntity>) {
  //   console.log(`AFTER ENTITY UPDATED: `, event.entity)
  // }

}
